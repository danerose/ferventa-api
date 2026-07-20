import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { AppointmentsService } from '../appointments/appointments.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Branch, BranchDocument } from './schemas/branch.schema';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class BranchesService {
  constructor(
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
    private readonly i18n: I18nService,
    @Inject(forwardRef(() => AppointmentsService))
    private readonly appointmentsService: AppointmentsService,
  ) {}

  async create(createBranchDto: CreateBranchDto): Promise<Branch> {
    const createdBranch = new this.branchModel(createBranchDto);
    const savedBranch = await createdBranch.save();
    
    // Initialize default working schedule for this new branch
    await this.appointmentsService.createDefaultScheduleForBranch((savedBranch._id as any).toString());
    
    return savedBranch;
  }

  async findAll(isActive?: boolean): Promise<Branch[]> {
    const filter = isActive !== undefined ? { isActive } : {};
    return this.branchModel.find(filter).exec();
  }

  async findOne(id: string): Promise<Branch> {
    const branch = await this.branchModel.findById(id).exec();
    if (!branch) {
      throw new NotFoundException(this.i18n.t('errors.notFound', { args: { item: 'Branch' } }));
    }
    return branch;
  }

  async update(id: string, updateBranchDto: UpdateBranchDto): Promise<Branch> {
    const updatedBranch = await this.branchModel
      .findByIdAndUpdate(id, updateBranchDto, { new: true })
      .exec();
    if (!updatedBranch) {
      throw new NotFoundException(this.i18n.t('errors.notFound', { args: { item: 'Branch' } }));
    }
    return updatedBranch;
  }

  async remove(id: string): Promise<Branch> {
    const deletedBranch = await this.branchModel.findByIdAndDelete(id).exec();
    if (!deletedBranch) {
      throw new NotFoundException(this.i18n.t('errors.notFound', { args: { item: 'Branch' } }));
    }
    return deletedBranch;
  }
}
