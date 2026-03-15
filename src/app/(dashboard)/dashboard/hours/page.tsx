'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useModal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';

interface DayHours {
  dayOfWeek: number;
  dayName: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export default function OperatingHoursPage() {
  const { showConfirm } = useModal();
  const { showToast } = useToast();

  const [hours, setHours] = useState<DayHours[]>([
    { dayOfWeek: 0, dayName: 'Sunday', openTime: '', closeTime: '', isClosed: true },
    { dayOfWeek: 1, dayName: 'Monday', openTime: '09:00', closeTime: '18:00', isClosed: false },
    { dayOfWeek: 2, dayName: 'Tuesday', openTime: '09:00', closeTime: '18:00', isClosed: false },
    { dayOfWeek: 3, dayName: 'Wednesday', openTime: '09:00', closeTime: '18:00', isClosed: false },
    { dayOfWeek: 4, dayName: 'Thursday', openTime: '09:00', closeTime: '20:00', isClosed: false },
    { dayOfWeek: 5, dayName: 'Friday', openTime: '09:00', closeTime: '20:00', isClosed: false },
    { dayOfWeek: 6, dayName: 'Saturday', openTime: '08:00', closeTime: '17:00', isClosed: false },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const handleToggleClosed = (dayOfWeek: number) => {
    setHours(hours.map(day =>
      day.dayOfWeek === dayOfWeek
        ? { ...day, isClosed: !day.isClosed }
        : day
    ));
  };

  const handleTimeChange = (dayOfWeek: number, field: 'openTime' | 'closeTime', value: string) => {
    setHours(hours.map(day =>
      day.dayOfWeek === dayOfWeek
        ? { ...day, [field]: value }
        : day
    ));
  };

  const handleCopyToAll = (dayOfWeek: number) => {
    const dayToCopy = hours.find(day => day.dayOfWeek === dayOfWeek);
    if (!dayToCopy) return;

    showConfirm({
      title: 'Copy Hours',
      description: `Copy ${dayToCopy.dayName}'s hours to all other open days?`,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      onConfirm: () => {
        setHours(hours.map(day =>
          day.isClosed
            ? day
            : {
                ...day,
                openTime: dayToCopy.openTime,
                closeTime: dayToCopy.closeTime,
              }
        ));
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate times
    for (const day of hours) {
      if (!day.isClosed && (!day.openTime || !day.closeTime)) {
        showToast({
          title: 'Validation Error',
          description: `Please set both open and close times for ${day.dayName} or mark it as closed.`,
          variant: 'error',
        });
        setIsLoading(false);
        return;
      }

      if (!day.isClosed && day.openTime >= day.closeTime) {
        showToast({
          title: 'Validation Error',
          description: `${day.dayName}: Close time must be after open time.`,
          variant: 'error',
        });
        setIsLoading(false);
        return;
      }
    }

    // TODO: Implement API call to save hours
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsLoading(false);
    showToast({
      title: 'Success',
      description: 'Operating hours saved successfully!',
      variant: 'success',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Operating Hours</h1>
        <p className="text-muted-foreground mt-2">
          Set your weekly operating schedule
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
            <CardDescription>
              Configure your hours for each day of the week
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hours.map((day) => (
              <div key={day.dayOfWeek} className="flex items-center gap-4 p-4 border rounded-md">
                <div className="w-32">
                  <Label className="font-semibold">{day.dayName}</Label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`closed-${day.dayOfWeek}`}
                    checked={day.isClosed}
                    onChange={() => handleToggleClosed(day.dayOfWeek)}
                    className="rounded"
                  />
                  <Label
                    htmlFor={`closed-${day.dayOfWeek}`}
                    className="text-sm cursor-pointer"
                  >
                    Closed
                  </Label>
                </div>

                {!day.isClosed && (
                  <>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`open-${day.dayOfWeek}`} className="text-sm whitespace-nowrap">
                        Open:
                      </Label>
                      <Input
                        id={`open-${day.dayOfWeek}`}
                        type="time"
                        value={day.openTime}
                        onChange={(e) => handleTimeChange(day.dayOfWeek, 'openTime', e.target.value)}
                        required={!day.isClosed}
                        className="w-32"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Label htmlFor={`close-${day.dayOfWeek}`} className="text-sm whitespace-nowrap">
                        Close:
                      </Label>
                      <Input
                        id={`close-${day.dayOfWeek}`}
                        type="time"
                        value={day.closeTime}
                        onChange={(e) => handleTimeChange(day.dayOfWeek, 'closeTime', e.target.value)}
                        required={!day.isClosed}
                        className="w-32"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyToAll(day.dayOfWeek)}
                    >
                      Copy to All
                    </Button>
                  </>
                )}

                {day.isClosed && (
                  <span className="text-sm text-muted-foreground italic flex-1">
                    Closed all day
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setHours(hours.map(day => ({
                    ...day,
                    openTime: '09:00',
                    closeTime: '17:00',
                    isClosed: day.dayOfWeek === 0, // Close Sundays
                  })));
                }}
              >
                Set Standard Hours (9-5, Mon-Sat)
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setHours(hours.map(day => ({
                    ...day,
                    isClosed: day.dayOfWeek === 0 || day.dayOfWeek === 6,
                  })));
                }}
              >
                Close Weekends
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setHours(hours.map(day => ({
                    ...day,
                    isClosed: false,
                  })));
                }}
              >
                Open All Days
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Operating Hours'}
          </Button>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
