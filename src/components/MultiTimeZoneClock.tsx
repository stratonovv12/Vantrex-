import React, { useState, useEffect } from 'react';

interface TimeZoneData {
  name: string;
  timezone: string;
  offset: number;
}

const MultiTimeZoneClock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Define time zones to display
  const timeZones: TimeZoneData[] = [
    { name: 'New York', timezone: 'America/New_York', offset: -5 },
    { name: 'London', timezone: 'Europe/London', offset: 0 },
    { name: 'Tokyo', timezone: 'Asia/Tokyo', offset: 9 },
    { name: 'Sydney', timezone: 'Australia/Sydney', offset: 10 },
    { name: 'Dubai', timezone: 'Asia/Dubai', offset: 4 },
    { name: 'Los Angeles', timezone: 'America/Los_Angeles', offset: -8 },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTimeForTimezone = (date: Date, timezone: string): string => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(date);
    } catch {
      return 'Invalid TZ';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-2">Global Time</h1>
          <p className="text-slate-400 text-lg">Current time across major cities</p>
        </div>

        {/* Clock Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {timeZones.map((tz) => (
            <div
              key={tz.timezone}
              className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-6 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-slate-600"
            >
              {/* City Name */}
              <h2 className="text-xl font-semibold text-white mb-2">{tz.name}</h2>

              {/* Time Display */}
              <div className="bg-black rounded-lg p-4 mb-3">
                <div className="text-4xl font-mono font-bold text-cyan-400 text-center tracking-wider">
                  {formatTimeForTimezone(currentTime, tz.timezone)}
                </div>
              </div>

              {/* Timezone Info */}
              <div className="text-sm text-slate-400">
                <span className="text-slate-300">UTC</span>
                <span className="ml-2">
                  {tz.offset >= 0 ? '+' : ''}{tz.offset}:00
                </span>
              </div>

              {/* Day Indicator */}
              <div className="text-xs text-slate-500 mt-2">
                {new Intl.DateTimeFormat('en-US', {
                  timeZone: tz.timezone,
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                }).format(currentTime)}
              </div>
            </div>
          ))}
        </div>

        {/* Local Time Section */}
        <div className="mt-12 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-white mb-4">Your Local Time</h3>
          <div className="bg-black rounded-lg p-6">
            <div className="text-5xl font-mono font-bold text-cyan-300 text-center tracking-wider">
              {currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              })}
            </div>
            <div className="text-center text-slate-300 mt-4">
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-500 text-sm">
          <p>Updates every second • All times displayed in 12-hour format</p>
        </div>
      </div>
    </div>
  );
};

export default MultiTimeZoneClock;
