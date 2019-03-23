
export const numberFormatter = (maxLabels) => {
    const SUFFIXES = [
        { label: 'T', exp: 12 },
        { label: 'G', exp: 9 },
        { label: 'M', exp: 6 },
        { label: 'K', exp: 3 },
        { label: '', exp: 0 },
        { label: 'm', exp: -3 },
        { label: 'u', exp: -6 },
        { label: 'n', exp: -9 },
    ];
    const LOGARITHM_STEP = 3;
    const BASE_STEPS = [2, 5, 10];
    const format = (min, max) => {
        const diff = max - min;
        const minStep = diff / maxLabels;
        const minStepLog = Math.log10(minStep);
        const minStepLogInt = Math.floor(minStepLog);
        const minStepLogMantissa = minStepLog - minStepLogInt;
        const minStepCoef = BASE_STEPS.find(x => minStepLogMantissa <= Math.log10(x));
        let suffix = SUFFIXES.find(x => minStepLog > x.exp);
        console.log(diff, minStep, minStepLog, minStepLogInt, minStepLogMantissa, minStepCoef, suffix);
        const labels = [];
        if (suffix) {
            const baseUnit = Math.pow(10, suffix.exp);
            const step = Math.pow(10, minStepLogInt) * minStepCoef;
            console.log(baseUnit, step);
            const shift = min > 0 ? (step - (min % step)) : -(min % step);
            for (let x = min + shift; x < max; x += step) {
                labels.push({ value: x, label: `${Math.round(x / baseUnit)}${suffix.label}` });
            }
            return { labels, step };
        } else {
            return null;
        }
    };
    return { format };
};

const MONTHES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatDateYear = value => new Date(value).getFullYear();
const formatDateMonthDay = value => {
    const date = new Date(value);
    const month = MONTHES[date.getMonth()];
    return `${month} ${date.getDate()}`;
};
const formatDateHoursMinutes = value => {
    const date = new Date(value);
    return `${date.getHours()} ${date.getMinutes()}`;
};

export const dateFormatter = (maxLabels) => {
    const RANGES = [
        { label: 'year', value: 31536000000, formatter: formatDateYear },
        { label: 'day', value: 86400000, formatter: formatDateMonthDay },
        { label: 'minute', value: 60000, formatter: formatDateHoursMinutes },
    ];
    const nf = numberFormatter(maxLabels);
    const format = (min, max) => {
        const { labels, step } = nf.format(min, max);
        const newLabels = labels.map(({ value, label }) => {
            const range = RANGES.find(r => step >= r.value);
            const dateLabel = range && range.formatter(value);
            return {
                value,
                label: dateLabel || label,
            };
        });
        return { labels: newLabels, step };
    }
    return { format };
};
