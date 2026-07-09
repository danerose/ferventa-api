import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Appointment, AppointmentDocument } from './schemas/appointment.schema';
import { WorkshopSchedule, WorkshopScheduleDocument } from './schemas/workshop-schedule.schema';
import { WorkshopHoliday, WorkshopHolidayDocument } from './schemas/workshop-holiday.schema';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CustomersService } from '../customers/customers.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { WhatsAppService } from './whatsapp.service';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class AppointmentsService implements OnModuleInit {
  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(WorkshopSchedule.name) private scheduleModel: Model<WorkshopScheduleDocument>,
    @InjectModel(WorkshopHoliday.name) private holidayModel: Model<WorkshopHolidayDocument>,
    private readonly customersService: CustomersService,
    private readonly vehiclesService: VehiclesService,
    private readonly whatsAppService: WhatsAppService,
  ) { }

  async onModuleInit() {
    const count = await this.scheduleModel.countDocuments();
    if (count === 0) {
      const defaultSchedules = [
        { dayOfWeek: 0, isWorking: false, startTime: '09:00', endTime: '17:00' }, // Sunday
        { dayOfWeek: 1, isWorking: true, startTime: '09:00', endTime: '17:00' },  // Monday
        { dayOfWeek: 2, isWorking: true, startTime: '09:00', endTime: '17:00' },  // Tuesday
        { dayOfWeek: 3, isWorking: true, startTime: '09:00', endTime: '17:00' },  // Wednesday
        { dayOfWeek: 4, isWorking: true, startTime: '09:00', endTime: '17:00' },  // Thursday
        { dayOfWeek: 5, isWorking: true, startTime: '09:00', endTime: '17:00' },  // Friday
        { dayOfWeek: 6, isWorking: true, startTime: '09:00', endTime: '15:00' },  // Saturday
      ];
      await this.scheduleModel.insertMany(defaultSchedules);
      console.log('Seeded default workshop schedules.');
    }
  }

  async validateBookingTime(scheduledAt: Date, duration: number, excludeAppointmentId?: string): Promise<void> {
    if (scheduledAt.getTime() < Date.now()) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.pastDate') : 'No se pueden agendar citas en el pasado');
    }

    const year = scheduledAt.getUTCFullYear();
    const month = String(scheduledAt.getUTCMonth() + 1).padStart(2, '0');
    const day = String(scheduledAt.getUTCDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;


    // 1. Check if holiday
    const isHoliday = await this.holidayModel.findOne({ date: dateStr }).exec();
    if (isHoliday) {
      const i18n = I18nContext.current();
      const message = i18n
        ? i18n.t('common.errors.holidayClosure', { args: { date: dateStr, description: isHoliday.description } })
        : `El taller estará cerrado el día ${dateStr}: ${isHoliday.description}`;
      throw new BadRequestException(message);
    }

    // 2. Check working day of week
    const dayOfWeek = scheduledAt.getUTCDay();
    const schedule = await this.scheduleModel.findOne({ dayOfWeek }).exec();
    if (!schedule || !schedule.isWorking) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.nonWorkingDay') : 'El taller no labora en este día de la semana');
    }

    // 3. Check within working hours
    const appointmentStartMinutes = scheduledAt.getUTCHours() * 60 + scheduledAt.getUTCMinutes();
    const appointmentEndMinutes = appointmentStartMinutes + duration;

    const [startHour, startMin] = schedule.startTime.split(':').map(Number);
    const [endHour, endMin] = schedule.endTime.split(':').map(Number);
    const workStartMinutes = startHour * 60 + startMin;
    const workEndMinutes = endHour * 60 + endMin;

    if (appointmentStartMinutes < workStartMinutes || appointmentEndMinutes > workEndMinutes) {
      const i18n = I18nContext.current();
      const message = i18n
        ? i18n.t('common.errors.outsideWorkingHours', { args: { start: schedule.startTime, end: schedule.endTime } })
        : `La cita debe estar dentro del horario laboral (${schedule.startTime} - ${schedule.endTime})`;
      throw new BadRequestException(message);
    }

    // 4. Check overlaps with approved/pending appointments
    const appointmentStart = scheduledAt;
    const appointmentEnd = new Date(scheduledAt.getTime() + duration * 60 * 1000);

    const dayStart = new Date(scheduledAt);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(scheduledAt);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const sameDayAppointments = await this.appointmentModel.find({
      status: { $in: ['pending', 'approved', 'rescheduled'] },
      _id: { $ne: excludeAppointmentId as any },
      scheduledAt: { $gte: dayStart, $lte: dayEnd },
    }).exec();

    for (const appt of sameDayAppointments) {
      const apptStart = appt.scheduledAt;
      const apptEnd = new Date(apptStart.getTime() + (appt.duration || 15) * 60 * 1000);

      if (apptStart < appointmentEnd && apptEnd > appointmentStart) {
        const timeFormat = (d: Date) => {
          const hours = String(d.getUTCHours()).padStart(2, '0');
          const minutes = String(d.getUTCMinutes()).padStart(2, '0');
          return `${hours}:${minutes}`;
        };
        const i18n = I18nContext.current();
        const startStr = timeFormat(apptStart);
        const endStr = timeFormat(apptEnd);
        const message = i18n
          ? i18n.t('common.errors.appointmentOverlap', { args: { start: startStr, end: endStr } })
          : `Horario ocupado. Traslape detectado con otra cita agendada de ${startStr} a ${endStr}`;
        throw new BadRequestException(message);
      }
    }
  }

  async create(createAppointmentDto: CreateAppointmentDto): Promise<AppointmentDocument> {
    const scheduledAtDate = new Date(createAppointmentDto.scheduledAt);
    const duration = createAppointmentDto.duration || 15;
    await this.validateBookingTime(scheduledAtDate, duration);

    let customerId = createAppointmentDto.customerId;
    const phone = createAppointmentDto.customerPhone.trim();

    let customer: any = null;
    if (customerId) {
      customer = await this.customersService.findById(customerId);
    } else {
      try {
        customer = await this.customersService.findByPhone(phone);
        customerId = (customer._id as any).toString();
      } catch (e) {
        if (!(e instanceof NotFoundException)) throw e;
        customer = await this.customersService.create({
          name: createAppointmentDto.customerName,
          email: createAppointmentDto.customerEmail,
          phone: phone,
          whatsappId: createAppointmentDto.whatsappId,
        });
        customerId = (customer._id as any).toString();
      }
    }

    const serialNumberLastFour = createAppointmentDto.vehicle.serialNumberLastFour.toUpperCase().trim();
    let vehicle: any = null;
    try {
      // If the vehicle already exists (same serial), reuse it
      vehicle = await this.vehiclesService.findBySerialNumberLastFour(serialNumberLastFour);
    } catch (e) {
      if (!(e instanceof NotFoundException)) throw e;
      // Vehicle not found → create a new one
      vehicle = await this.vehiclesService.create({
        customerId: customerId!,
        brand: createAppointmentDto.vehicle.brand,
        model: createAppointmentDto.vehicle.model,
        year: createAppointmentDto.vehicle.year,
        serialNumberLastFour: serialNumberLastFour,
      });
    }

    const appointment = new this.appointmentModel({
      ...createAppointmentDto,
      customer: customerId as any,
      scheduledAt: scheduledAtDate,
    });

    return (await appointment.save()).populate('customer');
  }

  async findAll(filters: {
    search?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<AppointmentDocument[]> {
    const query: any = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.fromDate || filters.toDate) {
      query.scheduledAt = {};
      if (filters.fromDate) {
        query.scheduledAt.$gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        query.scheduledAt.$lte = new Date(filters.toDate);
      }
    }

    if (filters.search) {
      query.$or = [
        { customerName: { $regex: filters.search, $options: 'i' } },
        { customerPhone: { $regex: filters.search, $options: 'i' } },
        { serviceRequested: { $regex: filters.search, $options: 'i' } },
        { 'vehicle.serialNumberLastFour': { $regex: filters.search, $options: 'i' } },
      ];
    }

    return this.appointmentModel.find(query).populate('customer').sort({ scheduledAt: 1 }).exec();
  }

  async findById(id: string): Promise<AppointmentDocument> {
    if (!Types.ObjectId.isValid(id)) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.invalidAppointmentId') : 'ID de cita inválido');
    }
    const appointment = await this.appointmentModel.findById(id).populate('customer').exec();
    if (!appointment) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.appointmentNotFound') : 'Cita no encontrada');
    }
    return appointment;
  }

  async queryStatus(queryStr: string): Promise<AppointmentDocument[]> {
    const trimmed = queryStr.trim();
    const query: any = {};

    if (Types.ObjectId.isValid(trimmed)) {
      query._id = trimmed;
    } else {
      query.$or = [
        { customerPhone: trimmed },
        { 'vehicle.serialNumberLastFour': trimmed.toUpperCase() },
      ];
    }

    return this.appointmentModel.find(query).populate('customer').sort({ createdAt: -1 }).exec();
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto): Promise<AppointmentDocument> {
    const appointment = await this.findById(id);

    let scheduledAtDate = appointment.scheduledAt;
    let duration = appointment.duration || 15;
    if (updateAppointmentDto.scheduledAt) {
      scheduledAtDate = new Date(updateAppointmentDto.scheduledAt);
    }
    if (updateAppointmentDto.duration !== undefined) {
      duration = updateAppointmentDto.duration;
    }

    if (updateAppointmentDto.scheduledAt || updateAppointmentDto.duration !== undefined) {
      await this.validateBookingTime(scheduledAtDate, duration, id);
    }

    if (updateAppointmentDto.customerId) {
      const customer = await this.customersService.findById(updateAppointmentDto.customerId);
      appointment.customer = customer;
    }

    if (updateAppointmentDto.scheduledAt) {
      appointment.scheduledAt = scheduledAtDate;
    }

    if (updateAppointmentDto.duration !== undefined) {
      appointment.duration = duration;
    }

    if (updateAppointmentDto.assignedMechanic !== undefined) {
      appointment.assignedMechanic = updateAppointmentDto.assignedMechanic;
    }

    if (updateAppointmentDto.vehicle) {
      appointment.vehicle = {
        ...appointment.vehicle,
        ...updateAppointmentDto.vehicle,
      };
    }

    if (updateAppointmentDto.customerName) appointment.customerName = updateAppointmentDto.customerName;
    if (updateAppointmentDto.customerPhone) appointment.customerPhone = updateAppointmentDto.customerPhone;
    if (updateAppointmentDto.customerEmail) appointment.customerEmail = updateAppointmentDto.customerEmail;
    if (updateAppointmentDto.whatsappId !== undefined) appointment.whatsappId = updateAppointmentDto.whatsappId;
    if (updateAppointmentDto.serviceRequested) appointment.serviceRequested = updateAppointmentDto.serviceRequested;
    if (updateAppointmentDto.status) appointment.status = updateAppointmentDto.status;
    if (updateAppointmentDto.notes !== undefined) appointment.notes = updateAppointmentDto.notes;
    if (updateAppointmentDto.branchName !== undefined) appointment.branchName = updateAppointmentDto.branchName;

    return (await appointment.save()).populate('customer');
  }

  async remove(id: string): Promise<void> {
    const res = await this.appointmentModel.findByIdAndDelete(id);
    if (!res) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.appointmentNotFound') : 'Cita no encontrada');
    }
  }

  // --- WORKSHOP SCHEDULE CONFIG ---
  async getSchedule(): Promise<WorkshopSchedule[]> {
    return this.scheduleModel.find().sort({ dayOfWeek: 1 }).exec();
  }

  async updateSchedule(schedules: any[]): Promise<WorkshopSchedule[]> {
    for (const item of schedules) {
      await this.scheduleModel.findOneAndUpdate(
        { dayOfWeek: item.dayOfWeek },
        { isWorking: item.isWorking, startTime: item.startTime, endTime: item.endTime },
        { new: true, upsert: true }
      ).exec();
    }
    return this.getSchedule();
  }

  // --- WORKSHOP HOLIDAYS CONFIG ---
  async getHolidays(): Promise<WorkshopHoliday[]> {
    return this.holidayModel.find().sort({ date: 1 }).exec();
  }

  async addHoliday(date: string, description: string): Promise<WorkshopHoliday> {
    const existing = await this.holidayModel.findOne({ date }).exec();
    if (existing) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.holidayAlreadyRegistered') : 'Esta fecha ya está registrada como día festivo');
    }
    const holiday = new this.holidayModel({ date, description });
    return holiday.save();
  }

  async removeHoliday(id: string): Promise<void> {
    const i18n = I18nContext.current();
    if (Types.ObjectId.isValid(id)) {
      const res = await this.holidayModel.findByIdAndDelete(id).exec();
      if (!res) throw new NotFoundException(i18n ? i18n.t('common.errors.holidayNotFound') : 'Día festivo no encontrado');
    } else {
      const res = await this.holidayModel.findOneAndDelete({ date: id }).exec();
      if (!res) throw new NotFoundException(i18n ? i18n.t('common.errors.holidayNotFound') : 'Día festivo no encontrado');
    }
  }

  // --- OCCUPIED SLOTS ---
  async getOccupiedSlots(startDateStr: string, endDateStr: string): Promise<any> {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    const holidays = await this.holidayModel.find({
      date: { $gte: startDateStr, $lte: endDateStr }
    }).exec();

    const weeklySchedules = await this.scheduleModel.find().exec();
    const nonWorkingDaysOfWeek = weeklySchedules
      .filter(s => !s.isWorking)
      .map(s => s.dayOfWeek);

    const appointments = await this.appointmentModel.find({
      status: { $in: ['pending', 'approved', 'rescheduled'] },
      scheduledAt: { $gte: startDate, $lte: endDate }
    }).sort({ scheduledAt: 1 }).exec();

    const busySlots = appointments.map(appt => {
      const start = appt.scheduledAt;
      const end = new Date(start.getTime() + (appt.duration || 15) * 60 * 1000);

      const formatDateStr = (d: Date) => {
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dayStr = String(d.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${dayStr}`;
      };

      const formatTimeStr = (d: Date) => {
        const hours = String(d.getUTCHours()).padStart(2, '0');
        const minutes = String(d.getUTCMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      };

      return {
        appointmentId: appt._id,
        date: formatDateStr(start),
        startTime: formatTimeStr(start),
        endTime: formatTimeStr(end),
      };
    });

    return {
      holidays: holidays.map(h => ({ date: h.date, description: h.description })),
      nonWorkingDaysOfWeek,
      busySlots,
      workingHours: weeklySchedules.map(s => ({
        dayOfWeek: s.dayOfWeek,
        isWorking: s.isWorking,
        startTime: s.startTime,
        endTime: s.endTime
      }))
    };
  }

  // --- WEEKLY TIMELINE ---
  async getWeeklyTimeline(startDateStr: string, endDateStr: string): Promise<any[]> {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    end.setUTCHours(23, 59, 59, 999);

    const appointments = await this.appointmentModel.find({
      scheduledAt: { $gte: start, $lte: end }
    })
      .populate('customer')
      .sort({ scheduledAt: 1 })
      .exec();

    return appointments.map(appt => {
      const apptStart = appt.scheduledAt;
      const apptEnd = new Date(apptStart.getTime() + (appt.duration || 15) * 60 * 1000);

      const formatTimeStr = (d: Date) => {
        const hours = String(d.getUTCHours()).padStart(2, '0');
        const minutes = String(d.getUTCMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      };

      return {
        id: appt._id,
        customerName: appt.customerName,
        customerPhone: appt.customerPhone,
        customerEmail: appt.customerEmail,
        whatsappId: appt.whatsappId,
        serviceRequested: appt.serviceRequested,
        scheduledAt: appt.scheduledAt,
        duration: appt.duration || 15,
        status: appt.status,
        notes: appt.notes,
        assignedMechanic: appt.assignedMechanic || null,
        branchName: appt.branchName || null,
        vehicle: appt.vehicle,
        customer: appt.customer || null,
        startTime: formatTimeStr(apptStart),
        endTime: formatTimeStr(apptEnd),
      };
    });
  }

  // --- APPROVE, REJECT & RESCHEDULE WITH WHATSAPP ---
  async approve(id: string, message: string): Promise<AppointmentDocument> {
    const appointment = await this.findById(id);
    appointment.status = 'approved';
    const saved = await appointment.save();

    // Enviar mensaje de WhatsApp
    await this.whatsAppService.sendMessage(appointment.customerPhone, message);

    return saved.populate('customer');
  }

  async reject(id: string, message: string): Promise<AppointmentDocument> {
    const appointment = await this.findById(id);
    appointment.status = 'rejected';
    const saved = await appointment.save();

    // Enviar mensaje de WhatsApp
    await this.whatsAppService.sendMessage(appointment.customerPhone, message);

    return saved.populate('customer');
  }

  async reschedule(
    id: string,
    scheduledAtStr: string,
    duration: number,
    message: string,
  ): Promise<AppointmentDocument> {
    const appointment = await this.findById(id);
    const newScheduledAt = new Date(scheduledAtStr);

    // Validar el nuevo horario propuesto, excluyendo esta misma cita en el control de traslapes
    await this.validateBookingTime(newScheduledAt, duration, id);

    appointment.status = 'rescheduled'; // Cambia al estado reagendada
    appointment.scheduledAt = newScheduledAt;
    appointment.duration = duration;

    const saved = await appointment.save();

    // Enviar mensaje de WhatsApp
    await this.whatsAppService.sendMessage(appointment.customerPhone, message);

    return saved.populate('customer');
  }
}
