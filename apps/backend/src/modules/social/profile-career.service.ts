import { Injectable } from '@nestjs/common';
import type { SocialProfileEducation, SocialProfileExperience } from '@talpio/types';

import { AppException } from '@common/errors/app.exception';
import { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import type {
  CreateProfileEducationDto,
  CreateProfileExperienceDto,
  UpdateProfileEducationDto,
  UpdateProfileExperienceDto,
} from './dto/social.dto';
import { ProfilesService } from './profiles.service';
import {
  toSocialProfileEducation,
  toSocialProfileExperience,
  type SocialProfileEducationRow,
  type SocialProfileExperienceRow,
} from './social.mapper';

const MAX_EXPERIENCES = 20;
const MAX_EDUCATION = 20;

@Injectable()
export class ProfileCareerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profiles: ProfilesService,
  ) {}

  async createExperience(
    user: AuthenticatedUser,
    dto: CreateProfileExperienceDto,
  ): Promise<SocialProfileExperience> {
    const profile = await this.profiles.ensurePersonalProfile(user.id);
    await this.assertExperienceLimit(profile.id);
    this.assertDateRange(dto.startYear, dto.endYear, dto.isCurrent);

    const row = await this.prisma.socialProfileExperience.create({
      data: {
        profileId: profile.id,
        company: dto.company.trim(),
        title: dto.title.trim(),
        locationText: dto.locationText?.trim() || null,
        description: dto.description?.trim() || null,
        startYear: dto.startYear,
        startMonth: dto.startMonth ?? null,
        endYear: dto.isCurrent ? null : (dto.endYear ?? null),
        endMonth: dto.isCurrent ? null : (dto.endMonth ?? null),
        isCurrent: dto.isCurrent ?? false,
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    return toSocialProfileExperience(row);
  }

  async updateExperience(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateProfileExperienceDto,
  ): Promise<SocialProfileExperience> {
    const profile = await this.profiles.ensurePersonalProfile(user.id);
    const existing = await this.findOwnedExperience(profile.id, id);

    const isCurrent = dto.isCurrent ?? existing.isCurrent;
    const startYear = dto.startYear ?? existing.startYear;
    const endYear = dto.endYear !== undefined ? dto.endYear : existing.endYear;
    this.assertDateRange(startYear, endYear, isCurrent);

    const row = await this.prisma.socialProfileExperience.update({
      where: { id },
      data: {
        ...(dto.company !== undefined ? { company: dto.company.trim() } : {}),
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.locationText !== undefined ? { locationText: dto.locationText?.trim() || null } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.startYear !== undefined ? { startYear: dto.startYear } : {}),
        ...(dto.startMonth !== undefined ? { startMonth: dto.startMonth } : {}),
        ...(dto.endYear !== undefined ? { endYear: dto.endYear } : {}),
        ...(dto.endMonth !== undefined ? { endMonth: dto.endMonth } : {}),
        ...(dto.isCurrent !== undefined
          ? {
              isCurrent: dto.isCurrent,
              endYear: dto.isCurrent ? null : (dto.endYear ?? existing.endYear),
              endMonth: dto.isCurrent ? null : (dto.endMonth ?? existing.endMonth),
            }
          : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });

    return toSocialProfileExperience(row);
  }

  async deleteExperience(user: AuthenticatedUser, id: string): Promise<void> {
    const profile = await this.profiles.ensurePersonalProfile(user.id);
    await this.findOwnedExperience(profile.id, id);
    await this.prisma.socialProfileExperience.delete({ where: { id } });
  }

  async createEducation(
    user: AuthenticatedUser,
    dto: CreateProfileEducationDto,
  ): Promise<SocialProfileEducation> {
    const profile = await this.profiles.ensurePersonalProfile(user.id);
    await this.assertEducationLimit(profile.id);
    this.assertDateRange(dto.startYear, dto.endYear, dto.isCurrent);

    const row = await this.prisma.socialProfileEducation.create({
      data: {
        profileId: profile.id,
        school: dto.school.trim(),
        degree: dto.degree?.trim() || null,
        fieldOfStudy: dto.fieldOfStudy?.trim() || null,
        description: dto.description?.trim() || null,
        startYear: dto.startYear,
        startMonth: dto.startMonth ?? null,
        endYear: dto.isCurrent ? null : (dto.endYear ?? null),
        endMonth: dto.isCurrent ? null : (dto.endMonth ?? null),
        isCurrent: dto.isCurrent ?? false,
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    return toSocialProfileEducation(row);
  }

  async updateEducation(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateProfileEducationDto,
  ): Promise<SocialProfileEducation> {
    const profile = await this.profiles.ensurePersonalProfile(user.id);
    const existing = await this.findOwnedEducation(profile.id, id);

    const isCurrent = dto.isCurrent ?? existing.isCurrent;
    const startYear = dto.startYear ?? existing.startYear;
    const endYear = dto.endYear !== undefined ? dto.endYear : existing.endYear;
    this.assertDateRange(startYear, endYear, isCurrent);

    const row = await this.prisma.socialProfileEducation.update({
      where: { id },
      data: {
        ...(dto.school !== undefined ? { school: dto.school.trim() } : {}),
        ...(dto.degree !== undefined ? { degree: dto.degree?.trim() || null } : {}),
        ...(dto.fieldOfStudy !== undefined ? { fieldOfStudy: dto.fieldOfStudy?.trim() || null } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.startYear !== undefined ? { startYear: dto.startYear } : {}),
        ...(dto.startMonth !== undefined ? { startMonth: dto.startMonth } : {}),
        ...(dto.endYear !== undefined ? { endYear: dto.endYear } : {}),
        ...(dto.endMonth !== undefined ? { endMonth: dto.endMonth } : {}),
        ...(dto.isCurrent !== undefined
          ? {
              isCurrent: dto.isCurrent,
              endYear: dto.isCurrent ? null : (dto.endYear ?? existing.endYear),
              endMonth: dto.isCurrent ? null : (dto.endMonth ?? existing.endMonth),
            }
          : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });

    return toSocialProfileEducation(row);
  }

  async deleteEducation(user: AuthenticatedUser, id: string): Promise<void> {
    const profile = await this.profiles.ensurePersonalProfile(user.id);
    await this.findOwnedEducation(profile.id, id);
    await this.prisma.socialProfileEducation.delete({ where: { id } });
  }

  private async findOwnedExperience(profileId: string, id: string): Promise<SocialProfileExperienceRow> {
    const row = await this.prisma.socialProfileExperience.findFirst({
      where: { id, profileId },
    });
    if (!row) throw AppException.notFound('İş deneyimi', id);
    return row;
  }

  private async findOwnedEducation(profileId: string, id: string): Promise<SocialProfileEducationRow> {
    const row = await this.prisma.socialProfileEducation.findFirst({
      where: { id, profileId },
    });
    if (!row) throw AppException.notFound('Eğitim', id);
    return row;
  }

  private async assertExperienceLimit(profileId: string): Promise<void> {
    const count = await this.prisma.socialProfileExperience.count({ where: { profileId } });
    if (count >= MAX_EXPERIENCES) {
      throw AppException.badRequest('En fazla 20 iş deneyimi ekleyebilirsiniz.');
    }
  }

  private async assertEducationLimit(profileId: string): Promise<void> {
    const count = await this.prisma.socialProfileEducation.count({ where: { profileId } });
    if (count >= MAX_EDUCATION) {
      throw AppException.badRequest('En fazla 20 eğitim kaydı ekleyebilirsiniz.');
    }
  }

  private assertDateRange(startYear: number, endYear: number | null | undefined, isCurrent: boolean): void {
    const now = new Date().getFullYear();
    if (startYear < 1950 || startYear > now + 1) {
      throw AppException.badRequest('Başlangıç yılı geçersiz.');
    }
    if (!isCurrent && endYear != null && endYear < startYear) {
      throw AppException.badRequest('Bitiş yılı başlangıçtan önce olamaz.');
    }
  }
}
