/**
 * Helpers.
 */

interface MsOptions {
    long?: boolean;
}

type TimeUnit =
    | 'milliseconds' | 'millisecond' | 'msecs' | 'msec' | 'ms'
    | 'seconds' | 'second' | 'secs' | 'sec' | 's'
    | 'minutes' | 'minute' | 'mins' | 'min' | 'm'
    | 'hours' | 'hour' | 'hrs' | 'hr' | 'h'
    | 'days' | 'day' | 'd'
    | 'weeks' | 'week' | 'w'
    | 'years' | 'year' | 'yrs' | 'yr' | 'y';

const SECOND: number = 1000;
const MINUTE: number = SECOND * 60;
const HOUR: number = MINUTE * 60;
const DAY: number = HOUR * 24;
const WEEK: number = DAY * 7;
const YEAR: number = DAY * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param val - String or Number to parse/format
 * @param options - Options object
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return String or Number
 * @api public
 */
function ms(val: string, options?: MsOptions): number;
function ms(val: number, options?: MsOptions): string;
function ms(val: string | number, options?: MsOptions): string | number {
    options = options || {};
    const type = typeof val;
    if (type === 'string' && (val as string).length > 0) {
        const result = parse(val as string);
        if (result === undefined) {
            throw new Error('Invalid time string: ' + val);
        }
        return result;
    } else if (type === 'number' && isFinite(val as number)) {
        return options.long ? fmtLong(val as number) : fmtShort(val as number);
    }
    throw new Error(
        'val is not a non-empty string or a valid number. val=' +
        JSON.stringify(val)
    );
}

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param str - String to parse
 * @return Number of milliseconds
 * @api private
 */
function parse(str: string): number | undefined {
    str = String(str);
    if (str.length > 100) {
        return;
    }
    const match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        str
    );
    if (!match) {
        return;
    }
    const n = parseFloat(match[1]);
    const type = (match[2] || 'ms').toLowerCase() as TimeUnit;
    switch (type) {
        case 'years':
        case 'year':
        case 'yrs':
        case 'yr':
        case 'y':
            return n * YEAR;
        case 'weeks':
        case 'week':
        case 'w':
            return n * WEEK;
        case 'days':
        case 'day':
        case 'd':
            return n * DAY;
        case 'hours':
        case 'hour':
        case 'hrs':
        case 'hr':
        case 'h':
            return n * HOUR;
        case 'minutes':
        case 'minute':
        case 'mins':
        case 'min':
        case 'm':
            return n * MINUTE;
        case 'seconds':
        case 'second':
        case 'secs':
        case 'sec':
        case 's':
            return n * SECOND;
        case 'milliseconds':
        case 'millisecond':
        case 'msecs':
        case 'msec':
        case 'ms':
            return n;
        default:
            return undefined;
    }
}

/**
 * Short format for `ms`.
 *
 * @param ms - Number of milliseconds
 * @return Formatted string
 * @api private
 */
function fmtShort(ms: number): string {
    const msAbs = Math.abs(ms);
    if (msAbs >= DAY) {
        return Math.round(ms / DAY) + 'd';
    }
    if (msAbs >= HOUR) {
        return Math.round(ms / HOUR) + 'h';
    }
    if (msAbs >= MINUTE) {
        return Math.round(ms / MINUTE) + 'm';
    }
    if (msAbs >= SECOND) {
        return Math.round(ms / SECOND) + 's';
    }
    return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param ms - Number of milliseconds
 * @return Formatted string
 * @api private
 */
function fmtLong(ms: number): string {
    const msAbs = Math.abs(ms);
    if (msAbs >= DAY) {
        return plural(ms, msAbs, DAY, 'day');
    }
    if (msAbs >= HOUR) {
        return plural(ms, msAbs, HOUR, 'hour');
    }
    if (msAbs >= MINUTE) {
        return plural(ms, msAbs, MINUTE, 'minute');
    }
    if (msAbs >= SECOND) {
        return plural(ms, msAbs, SECOND, 'second');
    }
    return ms + ' ms';
}

/**
 * Pluralization helper.
 *
 * @param ms - Number of milliseconds
 * @param msAbs - Absolute value of milliseconds
 * @param n - Unit multiplier
 * @param name - Unit name
 * @return Formatted string with pluralization
 */
function plural(ms: number, msAbs: number, n: number, name: string): string {
    const isPlural = msAbs >= n * 1.5;
    return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
}

export default ms;