export interface WeatherLocation {
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  temperature: number;
  humidity: number;
  apparent_temperature: number;
  precipitation: number;
  wind_speed: number;
  weather_code: number;
  condition: string;
}

export interface DailyForecast {
  date: string;
  temperature_max: number;
  temperature_min: number;
  precipitation: number;
  rain_probability: number;
  weather_code: number;
  condition: string;
}

export interface WeatherResponse {
  location: WeatherLocation;
  current: CurrentWeather;
  daily: DailyForecast[];
  farm_id: string | null;
  farm_name: string | null;
}
