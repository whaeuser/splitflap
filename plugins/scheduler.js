/**
 * Scheduler Plugin for Split-Flap Display
 * Schedule display content at specific times
 */

import { Plugin } from '../js/plugins.js';

export class SchedulerPlugin extends Plugin {
    constructor() {
        super('scheduler', '1.0.0', 'Schedule display content at specific times');
        this.schedules = new Map();
        this.checkInterval = null;
    }

    async init() {
        console.log('Scheduler plugin initializing...');
    }

    async enable() {
        // Start checking schedules every minute
        this.checkInterval = setInterval(() => this.checkSchedules(), 60000);
        // Also check immediately
        this.checkSchedules();
        console.log('Scheduler plugin enabled');
    }

    async disable() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        console.log('Scheduler plugin disabled');
    }

    /**
     * Add a schedule
     * @param {string} id - Unique schedule ID
     * @param {object} schedule - Schedule configuration
     * schedule: {
     *   time: '14:30',           // HH:MM format
     *   days: [0,1,2,3,4],      // Days of week (0=Sunday)
     *   action: 'setDisplay',    // Action to perform
     *   data: {...}             // Action data
     *   enabled: true           // Is schedule active
     * }
     */
    addSchedule(id, schedule) {
        if (!schedule.time || !schedule.action) {
            throw new Error('Schedule requires time and action');
        }

        this.schedules.set(id, {
            ...schedule,
            enabled: schedule.enabled !== false,
            lastRun: null
        });

        console.log(`Schedule "${id}" added`);
        return true;
    }

    /**
     * Remove a schedule
     */
    removeSchedule(id) {
        return this.schedules.delete(id);
    }

    /**
     * Enable/disable a schedule
     */
    setScheduleEnabled(id, enabled) {
        const schedule = this.schedules.get(id);
        if (schedule) {
            schedule.enabled = enabled;
            return true;
        }
        return false;
    }

    /**
     * Check all schedules and execute if needed
     */
    checkSchedules() {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const currentDay = now.getDay();
        const currentDate = now.toDateString();

        for (const [id, schedule] of this.schedules) {
            if (!schedule.enabled) continue;

            // Check if already run today
            if (schedule.lastRun === currentDate) continue;

            // Check time match
            if (schedule.time !== currentTime) continue;

            // Check day match
            if (schedule.days && !schedule.days.includes(currentDay)) continue;

            // Execute schedule
            this.executeSchedule(id, schedule);
            schedule.lastRun = currentDate;
        }
    }

    /**
     * Execute a schedule
     */
    executeSchedule(id, schedule) {
        console.log(`Executing schedule "${id}"`);

        try {
            // Emit event for external handling
            if (window.splitflapAPI) {
                switch (schedule.action) {
                    case 'setDisplay':
                        window.splitflapAPI.setDisplay(
                            schedule.data.line1 || '',
                            schedule.data.line2 || '',
                            schedule.data.line3 || '',
                            schedule.data.line4 || '',
                            schedule.data.line5 || '',
                            schedule.data.line6 || ''
                        );
                        break;
                    case 'clear':
                        window.splitflapAPI.clear();
                        break;
                    case 'demo':
                        window.splitflapAPI.demo();
                        break;
                    case 'datetime':
                        window.splitflapAPI.datetime(schedule.data.enable);
                        break;
                    default:
                        console.warn(`Unknown action: ${schedule.action}`);
                }
            }
        } catch (error) {
            console.error(`Failed to execute schedule "${id}":`, error);
        }
    }

    /**
     * List all schedules
     */
    listSchedules() {
        return Array.from(this.schedules.entries()).map(([id, schedule]) => ({
            id,
            ...schedule
        }));
    }

    /**
     * Get next scheduled execution
     */
    getNextExecution(id) {
        const schedule = this.schedules.get(id);
        if (!schedule || !schedule.enabled) return null;

        const now = new Date();
        const [hours, minutes] = schedule.time.split(':').map(Number);

        let next = new Date();
        next.setHours(hours, minutes, 0, 0);

        // If time has passed today, move to tomorrow
        if (next <= now) {
            next.setDate(next.getDate() + 1);
        }

        // If days are specified, find next matching day
        if (schedule.days && schedule.days.length > 0) {
            while (!schedule.days.includes(next.getDay())) {
                next.setDate(next.getDate() + 1);
            }
        }

        return next;
    }
}

// Create instance
export const schedulerPlugin = new SchedulerPlugin();