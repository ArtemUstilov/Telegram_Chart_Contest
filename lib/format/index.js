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
export const numberFormatter = (maxLabels) => {
  const BASE_STEPS = [2, 3, 5, 7, 10];
  const format = (min, max) => {
    if (isNaN(min) || isNaN(max)) {
      return null;
    }
    const diff = max - min;
    const minStep = diff / maxLabels;
    const minStepLog = Math.log10(minStep);
    const minStepLogInt = Math.floor(minStepLog);
    const minStepLogMantissa = minStepLog - minStepLogInt;
    const minStepCoef = BASE_STEPS.find(x => minStepLogMantissa <= Math.log10(x));
    let suffix = SUFFIXES.find(x => minStepLog > x.exp);
    const labels = [];
    if (suffix) {
      const baseUnit = Math.pow(10, suffix.exp);
      const step = Math.pow(10, minStepLogInt) * minStepCoef;
      const shift = min > 0 ? (step - (min % step)) : -(min % step);
      for (let x = min + shift; x <= max; x += step) {
        let t = (x / baseUnit);
        labels.push({ value: x, label: `${t}${x ? suffix.label : ''}` });
      }
      return { labels, step };
    } else {
      return null;
    }
  };
  return { format };
};
export const formatValue = (value, suffix) => {
  if (!value)
    return ({ value, label: '0' });
  const log = Math.log10(value);
 let suf = suffix || SUFFIXES.find(x => log > x.exp);
  const baseUnit = Math.pow(10, suf.exp);
  return ({ value, label: `${Math.round(value / baseUnit)}${suf.label}`, suffix: suf });
};
const MONTHES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTHESFULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const formatDateYear = value => new Date(value).getFullYear();
const formatDateMonthDay = value => {
  const date = new Date(value);
  const month = MONTHES[date.getMonth()];
  return `${month} ${date.getDate()}`;
};
const formatDateHoursMinutes = value => {
  const date = new Date(value);
  let min = date.getMinutes();
  let hours = date.getHours();
  if(min < 20){
    min = '00';
  }else if(min < 40){
    min = '30';
  }else{
    min = '45';
  }
  return `${(date.getHours() < 10 ? '0' : '') + date.getHours()}:${min}`;
};

export const dateFormatter = (maxLabels) => {
  const RANGES = [
    { label: 'year', value: 31536000000, formatter: formatDateYear },
    { label: 'day', value: 86400000, formatter: formatDateMonthDay },
    { label: 'minute', value: 60000, formatter: formatDateHoursMinutes },
  ];
  const nf = numberFormatter(7);
  const format = (min, max) => {
    const numberLabels = nf.format(min, max);
    if (!numberLabels) {
      return null;
    }
    const { labels, step } = numberLabels;
    const newLabels = [];
    labels.forEach(({ value, label }) => {
      const range = RANGES.find(r => step > r.value);
      const dateLabel = range && range.formatter(value);
      newLabels.push({
        value,
        label: dateLabel || label,
      });
    });
    return { labels: newLabels, step };
  };
  return { format };
};
