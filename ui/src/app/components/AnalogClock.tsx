'use client';

import { useState, useEffect } from 'react';

export default function AnalogClock() {
  const [time, setTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTime(new Date());

    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!mounted || !time) {
    return (
      <div className="w-64 h-64 rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-sm flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-white"></div>
      </div>
    );
  }

  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const hourAngle = (hours * 30) + (minutes * 0.5);
  const minuteAngle = minutes * 6;
  const secondAngle = seconds * 6;

  const formatDate = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    return `${dayName}, ${monthName} ${day}, ${year}`;
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      {/* Analog Clock */}
      <div className="relative w-64 h-64 rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-sm shadow-2xl">
        {/* Hour markers */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30) - 90;
          const radian = (angle * Math.PI) / 180;
          const x = 128 + 100 * Math.cos(radian);
          const y = 128 + 100 * Math.sin(radian);
          return (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-white"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          );
        })}

        {/* Hour hand - White */}
        <div
          className="absolute origin-bottom"
          style={{
            width: '4px',
            height: '60px',
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -100%) rotate(${hourAngle}deg)`,
            transformOrigin: 'bottom center',
            backgroundColor: '#ffffff',
            boxShadow: '0 0 4px rgba(0,0,0,0.3)',
          }}
        />

        {/* Minute hand - Light blue */}
        <div
          className="absolute origin-bottom"
          style={{
            width: '3px',
            height: '90px',
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)`,
            transformOrigin: 'bottom center',
            backgroundColor: '#66a5ff',
            boxShadow: '0 0 4px rgba(0,0,0,0.3)',
          }}
        />

        {/* Second hand - Accent color */}
        <div
          className="absolute origin-bottom"
          style={{
            width: '2px',
            height: '100px',
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -100%) rotate(${secondAngle}deg)`,
            transformOrigin: 'bottom center',
            backgroundColor: '#f24d12',
            boxShadow: '0 0 2px rgba(0,0,0,0.3)',
          }}
        />

        {/* Center dot */}
        <div className="absolute w-4 h-4 rounded-full bg-white left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-lg"></div>
      </div>

      {/* Date */}
      <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 border border-white/30">
        <p className="text-lg font-medium text-center text-white" style={{ color: '#ffffff' }} suppressHydrationWarning>
          {formatDate(time)}
        </p>
      </div>
    </div>
  );
}

