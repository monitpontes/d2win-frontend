export { api, default as apiClient } from './client';
export { authService, mapApiUserToUser } from './auth';
export { companiesService, mapApiCompanyToCompany } from './companies';
export { bridgesService, mapApiBridgeToBridge } from './bridges';
export { usersService } from './users';
export { devicesService, mapApiDeviceToSensor } from './devices';
export { telemetryService } from './telemetry';

export type { LoginResponse, ApiUser } from './auth';
export type { ApiCompany, CreateCompanyData } from './companies';
export type { ApiBridge } from './bridges';
export type { CreateUserData, UpdateUserData } from './users';
export type { ApiDevice } from './devices';
export type { TelemetryData, TelemetryHistoryParams, TelemetryTimeSeriesPoint } from './telemetry';
