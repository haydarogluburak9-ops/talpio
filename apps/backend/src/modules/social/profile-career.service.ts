import { Injectable } from '@nestjs/common';
import type {
  SocialProfileEducation,
  SocialProfileExperience,
  SocialProfileSkill,
} from '@talpio/types';

import { AppException } from '@common/errors/app.exception';
import { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import type {
  CreateProfileEducationDto,
  CreateProfileExperienceDto,
  CreateProfileSkillDto,
  UpdateProfileEducationDto,
  UpdateProfileExperienceDto,
  UpdateProfileSkillDto,
} from './dto/social.dto';
import { ProfilesService } from './profiles.service';
import {
  toSocialProfileEducation,
  toSocialProfileExperience,
  toSocialProfileSkill,
  type SocialProfileEducationRow,
  type SocialProfileExperienceRow,
  type SocialProfileSkillRow,
} from './social.mapper';

const MAX_EXPERIENCES = 20;
const MAX_EDUCATION = 20;
const MAX_SKILLS = 50;

/** Tek harfte tüm tabloyu taramak yerine kullanıcı biraz yazana kadar beklenir. */
const SKILL_SUGGEST_MIN_LENGTH = 2;
const SKILL_SUGGEST_LIMIT = 10;

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
    this.assertDateRange(dto.startYear, dto.endYear, dto.isCurrent ?? false);

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
        ...(dto.locationText !== undefined
          ? { locationText: dto.locationText?.trim() || null }
          : {}),
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
    this.assertDateRange(dto.startYear, dto.endYear, dto.isCurrent ?? false);

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
        ...(dto.fieldOfStudy !== undefined
          ? { fieldOfStudy: dto.fieldOfStudy?.trim() || null }
          : {}),
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

  async createSkill(
    user: AuthenticatedUser,
    dto: CreateProfileSkillDto,
  ): Promise<SocialProfileSkill> {
    const profile = await this.profiles.ensurePersonalProfile(user.id);
    await this.assertSkillLimit(profile.id);
    const name = dto.name.trim();
    if (!name) {
      throw new AppException('VALIDATION_ERROR', { message: 'Yetkinlik adı gerekli.' });
    }

    const row = await this.prisma.socialProfileSkill.create({
      data: {
        profileId: profile.id,
        name,
        level: dto.level ?? null,
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    return toSocialProfileSkill(row);
  }

  async updateSkill(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateProfileSkillDto,
  ): Promise<SocialProfileSkill> {
    const profile = await this.profiles.ensurePersonalProfile(user.id);
    const existing = await this.findOwnedSkill(profile.id, id);
    const name = dto.name !== undefined ? dto.name.trim() : existing.name;
    if (!name) {
      throw new AppException('VALIDATION_ERROR', { message: 'Yetkinlik adı gerekli.' });
    }

    const row = await this.prisma.socialProfileSkill.update({
      where: { id },
      data: {
        name,
        // `null` dereceyi temizler, `undefined` alana hiç dokunmaz.
        ...(dto.level !== undefined ? { level: dto.level } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });

    return toSocialProfileSkill(row);
  }

  /**
   * Yetkinlik adı önerileri.
   *
   * Öneriler platformda halihazırda kullanılan adlardan gelir; sabit bir
   * katalog tutulsaydı altı dile elle çevrilmesi gerekir ve kullanıcının kendi
   * sektöründeki terimi yine listede bulunmazdı. Kullanım sayısına göre
   * sıralanır, böylece yaygın yazım öne çıkar ve aynı yetkinliğin farklı
   * varyasyonları zamanla tek biçimde toplanır.
   */
  async suggestSkills(query: string): Promise<string[]> {
    const needle = query.trim();
    if (needle.length < SKILL_SUGGEST_MIN_LENGTH) return [];

    const rows = await this.prisma.socialProfileSkill.groupBy({
      by: ['name'],
      where: { name: { contains: needle, mode: 'insensitive' } },
      _count: { name: true },
      orderBy: { _count: { name: 'desc' } },
      take: SKILL_SUGGEST_LIMIT,
    });

    return rows.map((row) => row.name);
  }

  async deleteSkill(user: AuthenticatedUser, id: string): Promise<void> {
    const profile = await this.profiles.ensurePersonalProfile(user.id);
    await this.findOwnedSkill(profile.id, id);
    await this.prisma.socialProfileSkill.delete({ where: { id } });
  }

  private async findOwnedExperience(
    profileId: string,
    id: string,
  ): Promise<SocialProfileExperienceRow> {
    const row = await this.prisma.socialProfileExperience.findFirst({
      where: { id, profileId },
    });
    if (!row) throw AppException.notFound('İş deneyimi', id);
    return row;
  }

  private async findOwnedEducation(
    profileId: string,
    id: string,
  ): Promise<SocialProfileEducationRow> {
    const row = await this.prisma.socialProfileEducation.findFirst({
      where: { id, profileId },
    });
    if (!row) throw AppException.notFound('Eğitim', id);
    return row;
  }

  private async findOwnedSkill(profileId: string, id: string): Promise<SocialProfileSkillRow> {
    const row = await this.prisma.socialProfileSkill.findFirst({
      where: { id, profileId },
    });
    if (!row) throw AppException.notFound('Yetkinlik', id);
    return row;
  }

  private async assertExperienceLimit(profileId: string): Promise<void> {
    const count = await this.prisma.socialProfileExperience.count({ where: { profileId } });
    if (count >= MAX_EXPERIENCES) {
      throw new AppException('VALIDATION_ERROR', {
        message: 'En fazla 20 iş deneyimi ekleyebilirsiniz.',
      });
    }
  }

  private async assertEducationLimit(profileId: string): Promise<void> {
    const count = await this.prisma.socialProfileEducation.count({ where: { profileId } });
    if (count >= MAX_EDUCATION) {
      throw new AppException('VALIDATION_ERROR', {
        message: 'En fazla 20 eğitim kaydı ekleyebilirsiniz.',
      });
    }
  }

  private async assertSkillLimit(profileId: string): Promise<void> {
    const count = await this.prisma.socialProfileSkill.count({ where: { profileId } });
    if (count >= MAX_SKILLS) {
      throw new AppException('VALIDATION_ERROR', {
        message: 'En fazla 50 yetkinlik ekleyebilirsiniz.',
      });
    }
  }

  private assertDateRange(
    startYear: number,
    endYear: number | null | undefined,
    isCurrent: boolean,
  ): void {
    const now = new Date().getFullYear();
    if (startYear < 1950 || startYear > now + 1) {
      throw new AppException('VALIDATION_ERROR', { message: 'Başlangıç yılı geçersiz.' });
    }
    if (!isCurrent && endYear != null && endYear < startYear) {
      throw new AppException('VALIDATION_ERROR', {
        message: 'Bitiş yılı başlangıçtan önce olamaz.',
      });
    }
  }
}
