import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { I18nContext } from 'nestjs-i18n';
import { Attendance, AttendanceDocument } from './schemas/attendance.schema';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import { StartBreakDto } from './dto/start-break.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { AttendanceSummaryQueryDto } from './dto/attendance-summary-query.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name)
    private readonly attendanceModel: Model<AttendanceDocument>,
  ) {}

  private getTodayDateString(): string {
    const now = new Date();
    // YYYY-MM-DD
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getUserQuery(userId: string) {
    if (!userId) return null;
    return isValidObjectId(userId) ? new Types.ObjectId(userId) : userId;
  }

  /**
   * Registrar entrada (Clock In)
   */
  async clockIn(userId: string, branchId: string, dto?: ClockInDto): Promise<AttendanceDocument> {
    const userObjId = this.getUserQuery(userId);
    const branchObjId = isValidObjectId(branchId) ? new Types.ObjectId(branchId) : branchId;

    // Verificar si ya existe un turno activo sin marcar salida
    const activeSession = await this.attendanceModel.findOne({
      user: userObjId as any,
      clockOut: null,
    });

    if (activeSession) {
      const i18n = I18nContext.current();
      throw new BadRequestException(
        i18n ? i18n.t('common.errors.alreadyClockedIn') : 'Ya tienes un registro de entrada activo',
      );
    }

    const dateStr = this.getTodayDateString();
    const now = new Date();

    const attendance = new this.attendanceModel({
      user: userObjId as any,
      branch: branchObjId as any,
      date: dateStr,
      clockIn: now,
      clockOut: null,
      breaks: [],
      status: 'working',
      totalWorkMinutes: 0,
      totalBreakMinutes: 0,
      netWorkMinutes: 0,
      clockInNote: dto?.note || '',
    });

    return attendance.save();
  }

  /**
   * Registrar salida (Clock Out)
   */
  async clockOut(userId: string, dto?: ClockOutDto): Promise<AttendanceDocument> {
    const userObjId = this.getUserQuery(userId);
    const activeSession = await this.attendanceModel.findOne({
      user: userObjId as any,
      clockOut: null,
    });

    if (!activeSession) {
      const i18n = I18nContext.current();
      throw new BadRequestException(
        i18n ? i18n.t('common.errors.notClockedIn') : 'No has registrado tu entrada para este turno',
      );
    }

    if (activeSession.status === 'on_break') {
      const i18n = I18nContext.current();
      throw new BadRequestException(
        i18n
          ? i18n.t('common.errors.cannotClockOutOnBreak')
          : 'Debes finalizar tu descanso antes de registrar tu salida',
      );
    }

    const now = new Date();
    activeSession.clockOut = now;
    activeSession.status = 'completed';
    if (dto?.note) {
      activeSession.clockOutNote = dto.note;
    }

    // Calcular tiempos
    const clockInTime = new Date(activeSession.clockIn).getTime();
    const clockOutTime = now.getTime();
    const totalWorkMinutes = Math.max(0, Math.round((clockOutTime - clockInTime) / 60000));

    let totalBreakMinutes = 0;
    if (activeSession.breaks && activeSession.breaks.length > 0) {
      for (const b of activeSession.breaks) {
        if (b.durationMinutes) {
          totalBreakMinutes += b.durationMinutes;
        } else if (b.startTime && b.endTime) {
          const bStart = new Date(b.startTime).getTime();
          const bEnd = new Date(b.endTime).getTime();
          totalBreakMinutes += Math.max(0, Math.round((bEnd - bStart) / 60000));
        }
      }
    }

    activeSession.totalWorkMinutes = totalWorkMinutes;
    activeSession.totalBreakMinutes = totalBreakMinutes;
    activeSession.netWorkMinutes = Math.max(0, totalWorkMinutes - totalBreakMinutes);

    return activeSession.save();
  }

  /**
   * Iniciar un descanso (Start Break)
   */
  async startBreak(userId: string, dto?: StartBreakDto): Promise<AttendanceDocument> {
    const userObjId = this.getUserQuery(userId);
    const activeSession = await this.attendanceModel.findOne({
      user: userObjId as any,
      clockOut: null,
    });

    if (!activeSession) {
      const i18n = I18nContext.current();
      throw new BadRequestException(
        i18n ? i18n.t('common.errors.notClockedIn') : 'No has registrado tu entrada para este turno',
      );
    }

    if (activeSession.status === 'on_break') {
      const i18n = I18nContext.current();
      throw new BadRequestException(
        i18n ? i18n.t('common.errors.alreadyOnBreak') : 'Ya te encuentras en un descanso',
      );
    }

    const now = new Date();
    activeSession.breaks.push({
      startTime: now,
      note: dto?.note || '',
    } as any);

    activeSession.status = 'on_break';
    return activeSession.save();
  }

  /**
   * Finalizar descanso actual (End Break)
   */
  async endBreak(userId: string): Promise<AttendanceDocument> {
    const userObjId = this.getUserQuery(userId);
    const activeSession = await this.attendanceModel.findOne({
      user: userObjId as any,
      clockOut: null,
    });

    if (!activeSession || activeSession.status !== 'on_break') {
      const i18n = I18nContext.current();
      throw new BadRequestException(
        i18n ? i18n.t('common.errors.notOnBreak') : 'No te encuentras en un descanso actualmente',
      );
    }

    const now = new Date();
    const currentBreak = activeSession.breaks.find((b) => !b.endTime);

    if (currentBreak) {
      currentBreak.endTime = now;
      const bStart = new Date(currentBreak.startTime).getTime();
      const bEnd = now.getTime();
      currentBreak.durationMinutes = Math.max(0, Math.round((bEnd - bStart) / 60000));
    }

    // Recalcular total de minutos de descanso acumulados hasta ahora
    let totalBreakMinutes = 0;
    for (const b of activeSession.breaks) {
      if (b.durationMinutes) {
        totalBreakMinutes += b.durationMinutes;
      }
    }

    activeSession.totalBreakMinutes = totalBreakMinutes;
    activeSession.status = 'working';
    return activeSession.save();
  }

  /**
   * Obtener el estado actual del día / turno activo para el usuario
   */
  async getTodayStatus(userId: string) {
    const userObjId = this.getUserQuery(userId);
    const activeSession = await this.attendanceModel
      .findOne({ user: userObjId as any, clockOut: null })
      .populate('branch', 'name city')
      .exec();

    if (activeSession) {
      const now = new Date();
      const clockInTime = new Date(activeSession.clockIn).getTime();
      const currentWorkMinutes = Math.max(0, Math.round((now.getTime() - clockInTime) / 60000));

      let totalBreakMinutes = activeSession.totalBreakMinutes || 0;
      let activeBreak: any = null;

      const ongoingBreak = activeSession.breaks.find((b) => !b.endTime);
      if (ongoingBreak) {
        const bStart = new Date(ongoingBreak.startTime).getTime();
        const ongoingBreakMinutes = Math.max(0, Math.round((now.getTime() - bStart) / 60000));
        activeBreak = {
          startTime: ongoingBreak.startTime,
          durationMinutes: ongoingBreakMinutes,
          note: ongoingBreak.note,
        };
        totalBreakMinutes += ongoingBreakMinutes;
      }

      return {
        hasActiveShift: true,
        status: activeSession.status,
        attendance: activeSession,
        currentWorkMinutes,
        currentWorkHours: Number((currentWorkMinutes / 60).toFixed(2)),
        totalBreakMinutes,
        totalBreakHours: Number((totalBreakMinutes / 60).toFixed(2)),
        netWorkMinutes: Math.max(0, currentWorkMinutes - totalBreakMinutes),
        netWorkHours: Number((Math.max(0, currentWorkMinutes - totalBreakMinutes) / 60).toFixed(2)),
        activeBreak,
      };
    }

    // Buscar el último registro completado de hoy
    const todayStr = this.getTodayDateString();
    const lastRecordToday = await this.attendanceModel
      .findOne({ user: userObjId as any, date: todayStr })
      .sort({ createdAt: -1 })
      .populate('branch', 'name city')
      .exec();

    return {
      hasActiveShift: false,
      status: 'off_shift',
      lastRecordToday: lastRecordToday || null,
    };
  }

  /**
   * Obtener los registros personales del usuario autenticado
   */
  async getMyRecords(userId: string, startDate?: string, endDate?: string): Promise<AttendanceDocument[]> {
    const userObjId = this.getUserQuery(userId);
    const query: any = { user: userObjId as any };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    return this.attendanceModel
      .find(query)
      .sort({ date: -1, clockIn: -1 })
      .populate('branch', 'name city')
      .exec();
  }

  /**
   * Registros globales para Admin con filtros
   */
  async getAdminRecords(queryDto: AttendanceQueryDto): Promise<AttendanceDocument[]> {
    const query: any = {};

    if (queryDto.branchId) {
      query.branch = isValidObjectId(queryDto.branchId) ? new Types.ObjectId(queryDto.branchId) : queryDto.branchId;
    }

    if (queryDto.userId) {
      query.user = this.getUserQuery(queryDto.userId);
    }

    if (queryDto.status) {
      query.status = queryDto.status;
    }

    if (queryDto.startDate || queryDto.endDate) {
      query.date = {};
      if (queryDto.startDate) query.date.$gte = queryDto.startDate;
      if (queryDto.endDate) query.date.$lte = queryDto.endDate;
    }

    return this.attendanceModel
      .find(query)
      .sort({ date: -1, clockIn: -1 })
      .populate('user', 'name email username role')
      .populate('branch', 'name city')
      .exec();
  }

  /**
   * Resumen administrativo
   */
  async getAdminSummary(queryDto: AttendanceSummaryQueryDto): Promise<any> {
    let startDateStr = queryDto.startDate;
    let endDateStr = queryDto.endDate;

    const now = new Date();
    if (!queryDto.period || queryDto.period === 'weekly') {
      const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - dayOfWeek + 1);
      startDateStr = monday.toISOString().split('T')[0];
      endDateStr = now.toISOString().split('T')[0];
    } else if (queryDto.period === 'biweekly') {
      const biweeklyStart = new Date(now);
      biweeklyStart.setDate(now.getDate() - 14);
      startDateStr = biweeklyStart.toISOString().split('T')[0];
      endDateStr = now.toISOString().split('T')[0];
    } else if (queryDto.period === 'monthly') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      startDateStr = firstDay.toISOString().split('T')[0];
      endDateStr = now.toISOString().split('T')[0];
    }

    const query: any = {};
    if (queryDto.branchId) {
      query.branch = isValidObjectId(queryDto.branchId) ? new Types.ObjectId(queryDto.branchId) : queryDto.branchId;
    }
    if (startDateStr || endDateStr) {
      query.date = {};
      if (startDateStr) query.date.$gte = startDateStr;
      if (endDateStr) query.date.$lte = endDateStr;
    }

    const records = await this.attendanceModel
      .find(query)
      .populate('user', 'name email username role branch')
      .populate('branch', 'name city')
      .exec();

    const userSummaryMap = new Map<string, any>();

    for (const record of records) {
      if (!record.user) continue;
      const userObj = record.user as any;
      const uId = String(userObj._id || userObj.id);

      if (!userSummaryMap.has(uId)) {
        const branchObj = record.branch as any;
        userSummaryMap.set(uId, {
          userId: uId,
          userName: userObj.name || 'Desconocido',
          userEmail: userObj.email || '',
          branchId: branchObj ? String(branchObj._id || branchObj.id) : '',
          branchName: branchObj ? branchObj.name : 'Matriz',
          totalShifts: 0,
          completedShifts: 0,
          totalWorkMinutes: 0,
          totalBreakMinutes: 0,
          netWorkMinutes: 0,
        });
      }

      const summary = userSummaryMap.get(uId)!;
      summary.totalShifts += 1;
      if (record.status === 'completed' || record.clockOut) {
        summary.completedShifts += 1;
      }
      summary.totalWorkMinutes += record.totalWorkMinutes || 0;
      summary.totalBreakMinutes += record.totalBreakMinutes || 0;
      summary.netWorkMinutes += record.netWorkMinutes || 0;
    }

    const usersSummary = Array.from(userSummaryMap.values()).map((u) => ({
      ...u,
      totalWorkHours: Number((u.totalWorkMinutes / 60).toFixed(2)),
      totalBreakHours: Number((u.totalBreakMinutes / 60).toFixed(2)),
      netWorkHours: Number((u.netWorkMinutes / 60).toFixed(2)),
    }));

    return {
      period: queryDto.period || 'weekly',
      range: {
        startDate: startDateStr,
        endDate: endDateStr,
      },
      usersSummary,
    };
  }

  /**
   * Desglose por usuario
   */
  async getAdminUserBreakdown(userId: string, startDate?: string, endDate?: string): Promise<any> {
    const userObjId = this.getUserQuery(userId);
    const records = await this.getMyRecords(userId, startDate, endDate);

    let totalShifts = records.length;
    let totalWorkMinutes = 0;
    let totalBreakMinutes = 0;
    let netWorkMinutes = 0;

    for (const r of records) {
      totalWorkMinutes += r.totalWorkMinutes || 0;
      totalBreakMinutes += r.totalBreakMinutes || 0;
      netWorkMinutes += r.netWorkMinutes || 0;
    }

    return {
      userId,
      records,
      totals: {
        totalShifts,
        totalWorkMinutes,
        totalBreakMinutes,
        netWorkMinutes,
        totalWorkHours: Number((totalWorkMinutes / 60).toFixed(2)),
        totalBreakHours: Number((totalBreakMinutes / 60).toFixed(2)),
        netWorkHours: Number((netWorkMinutes / 60).toFixed(2)),
      },
    };
  }

  /**
   * Modificar manualmente un registro de asistencia (Admin)
   */
  async updateAdminRecord(id: string, dto: UpdateAttendanceDto): Promise<AttendanceDocument> {
    const record = await this.attendanceModel.findById(id);
    if (!record) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.recordNotFound') : 'Registro de asistencia no encontrado');
    }

    if (dto.clockIn) {
      record.clockIn = new Date(dto.clockIn);
    }
    if (dto.clockOut) {
      record.clockOut = new Date(dto.clockOut);
      record.status = 'completed';
    }
    if (dto.adminNotes) {
      record.adminNotes = dto.adminNotes;
    }

    if (record.clockIn && record.clockOut) {
      const cIn = new Date(record.clockIn).getTime();
      const cOut = new Date(record.clockOut).getTime();
      const totalWorkMinutes = Math.max(0, Math.round((cOut - cIn) / 60000));
      record.totalWorkMinutes = totalWorkMinutes;
      record.netWorkMinutes = Math.max(0, totalWorkMinutes - (record.totalBreakMinutes || 0));
    }

    return record.save();
  }
}
