import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { City, Country, District } from '@ustapilot/types';
import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

import { Public } from '@modules/auth/decorators/public.decorator';

import { LocationsService } from './locations.service';

class ListCitiesQueryDto {
  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string;
}

class ListDistrictsQueryDto {
  @IsUUID()
  cityId!: string;
}

@ApiTags('Locations')
@Public()
@Controller('locations')
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Get('countries')
  @ApiOperation({ summary: 'Etkin ülkeleri listeler' })
  listCountries(): Promise<Country[]> {
    return this.locations.listCountries();
  }

  @Get('cities')
  @ApiOperation({ summary: 'Şehirleri listeler' })
  @ApiQuery({ name: 'countryCode', required: false, example: 'TR' })
  listCities(@Query() query: ListCitiesQueryDto): Promise<City[]> {
    return this.locations.listCities(query.countryCode);
  }

  @Get('districts')
  @ApiOperation({ summary: 'Bir şehrin ilçelerini listeler' })
  @ApiQuery({ name: 'cityId', required: true })
  listDistricts(@Query() query: ListDistrictsQueryDto): Promise<District[]> {
    return this.locations.listDistricts(query.cityId);
  }
}
