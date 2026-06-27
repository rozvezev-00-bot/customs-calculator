'use strict';

const R = window.CALC_RATES;

function findRow(table, value, key) {
  return table.find(row => value <= row[key]);
}

function calculateAge(year) {
  const ageYears = new Date().getFullYear() - year;
  return {
    ageYears,
    ageGroupETP:       ageYears <= 3 ? 'new' : ageYears <= 5 ? 'mid' : 'old',
    ageGroupDuty:      ageYears <= 3 ? 'new' : ageYears <= 7 ? 'used' : 'old',
    ageGroupRecycling: ageYears <= 3 ? 'new' : 'used',
  };
}

function convertToRubAndEur(value, currency) {
  const { EUR_RUB } = R.CURRENCY;
  if (currency === 'RUB') {
    return { valueRUB: value, valueEUR: value / EUR_RUB };
  }
  if (currency === 'EUR') {
    return { valueRUB: value * EUR_RUB, valueEUR: value };
  }
  const valueRUB = value * R.CURRENCY[currency + '_RUB'];
  return { valueRUB, valueEUR: valueRUB / EUR_RUB };
}

function calcETP(valueEUR, engineCC, ageGroupETP) {
  const { EUR_RUB } = R.CURRENCY;
  let etpEUR;
  if (ageGroupETP === 'new') {
    const row = findRow(R.ETP_NEW, valueEUR, 'maxEUR');
    etpEUR = Math.round(Math.max(valueEUR * row.percent, engineCC * row.minPerCC));
  } else {
    const table = ageGroupETP === 'mid' ? R.ETP_MID : R.ETP_OLD;
    const row = findRow(table, engineCC, 'maxCC');
    etpEUR = Math.round(engineCC * row.eurPerCC);
  }
  return { etpEUR, etpRUB: Math.round(etpEUR * EUR_RUB) };
}

function calcSTP(valueEUR) {
  const { EUR_RUB } = R.CURRENCY;
  const stpEUR = Math.round(valueEUR * R.EV_STP_RATE);
  return { stpEUR, stpRUB: Math.round(stpEUR * EUR_RUB) };
}

function calcDuty(valueRUB, valueEUR, engineCC, ageGroupDuty, engineType, country) {
  if (R.EAEU.includes(country)) return { dutyRUB: 0 };

  if (engineType === 'electric' || engineType === 'hybrid_sequential') {
    return { dutyRUB: Math.round(valueRUB * R.DUTY_EV_RATE) };
  }

  if (ageGroupDuty === 'new') {
    return { dutyRUB: Math.round(valueRUB * R.DUTY_NEW_RATE) };
  }

  const { EUR_RUB } = R.CURRENCY;

  if (ageGroupDuty === 'used') {
    const row = findRow(R.DUTY_USED, engineCC, 'maxCC');
    const dutyEUR = Math.round(Math.max(valueEUR * row.percent, engineCC * row.minPerCC));
    return { dutyRUB: Math.round(dutyEUR * EUR_RUB) };
  }

  // old
  const row = findRow(R.DUTY_OLD, engineCC, 'maxCC');
  const dutyEUR = Math.round(engineCC * row.eurPerCC);
  return { dutyRUB: Math.round(dutyEUR * EUR_RUB) };
}

function calcExcise(powerHP) {
  const row = findRow(R.EXCISE, powerHP, 'maxHP');
  return { exciseRUB: Math.round(powerHP * row.rubPerHP) };
}

function calcVAT(valueRUB, dutyRUB, exciseRUB) {
  return { vatRUB: Math.round((valueRUB + dutyRUB + exciseRUB) * R.VAT_RATE) };
}

function calcRecycling(engineCC, powerHP, ageGroupRecycling, buyerType, engineType, isPersonalUse) {
  const suffix = ageGroupRecycling === 'new' ? 'NEW' : 'USED';
  let table;

  if (engineType === 'electric' || engineType === 'hybrid_sequential') {
    table = R['RECYCLING_EV_' + suffix];
  } else if (engineCC < 1000) {
    table = R['RECYCLING_0_1L_' + suffix];
  } else if (engineCC < 2000) {
    table = R['RECYCLING_1_2L_' + suffix];
  } else if (engineCC <= 3000) {
    table = R['RECYCLING_2_3L_' + suffix];
  } else if (engineCC < 3500) {
    table = R['RECYCLING_3_3_5L_' + suffix];
  } else {
    table = R['RECYCLING_3_5L_PLUS_' + suffix];
  }

  const row = findRow(table, powerHP, 'maxHP');

  let isLgota = false;
  if (buyerType === 'individual' && isPersonalUse === true) {
    if (engineType === 'electric' || engineType === 'hybrid_sequential') {
      isLgota = powerHP <= R.RECYCLING_ЛЬГОТА_HP_EV;
    } else {
      isLgota = powerHP <= R.RECYCLING_ЛЬГОТА_HP_ICE && engineCC <= R.RECYCLING_ЛЬГОТА_CC_MAX;
    }
  }

  let coeff;
  if (isLgota) {
    coeff = ageGroupRecycling === 'new' ? R.RECYCLING_ЛЬГОТА_NEW : R.RECYCLING_ЛЬГОТА_USED;
  } else if (row.coeff_indiv === null && buyerType === 'individual') {
    // null означает что строка предназначена для льготников, но условие льготы не выполнено
    coeff = row.coeff_legal;
  } else if (buyerType === 'legal') {
    coeff = row.coeff_legal;
  } else {
    coeff = row.coeff_indiv;
  }

  return { recyclingRUB: Math.round(R.RECYCLING_BASE * coeff), isLgota };
}

function calcCustomsFee(valueRUB, payFee) {
  if (!payFee) return { customsFeeRUB: 0 };
  const row = findRow(R.CUSTOMS_FEE, valueRUB, 'maxRUB');
  return { customsFeeRUB: row.fee };
}

const VALID_CURRENCIES = ['RUB', 'EUR', 'CNY', 'USD', 'JPY', 'KRW', 'AED'];
const VALID_ENGINE_TYPES = ['gasoline', 'diesel', 'hybrid_parallel', 'hybrid_sequential', 'electric'];

function calculateAll(params) {
  const currentYear = new Date().getFullYear();

  if (!params.value || params.value <= 0 || !isFinite(params.value)) {
    throw new Error('Укажите таможенную стоимость (больше 0)');
  }

  const year = parseInt(params.year, 10);
  if (isNaN(year) || year < 1990 || year > currentYear) {
    throw new Error('Укажите корректный год выпуска (1990-' + currentYear + ')');
  }

  const powerHP = parseFloat(params.powerHP);
  if (isNaN(powerHP) || powerHP <= 0) {
    throw new Error('Укажите мощность двигателя (л.с.)');
  }

  if (!VALID_CURRENCIES.includes(params.currency)) {
    throw new Error('Неизвестная валюта: ' + params.currency);
  }

  if (!VALID_ENGINE_TYPES.includes(params.engineType)) {
    throw new Error('Неизвестный тип двигателя: ' + params.engineType);
  }

  const isElectricType = params.engineType === 'electric' || params.engineType === 'hybrid_sequential';
  const engineCC = isElectricType ? 0 : (parseFloat(params.engineCC) || 0);
  if (!isElectricType && engineCC <= 0) {
    throw new Error('Укажите объём двигателя (куб.см)');
  }

  const normalizedParams = { ...params, year, powerHP, engineCC };

  const { valueRUB, valueEUR } = convertToRubAndEur(normalizedParams.value, normalizedParams.currency);
  const { ageYears, ageGroupETP, ageGroupDuty, ageGroupRecycling } = calculateAge(year);

  // Физлицо + ДВС → ЕТП. Физлицо + электро/EREV → СТП (15%, без акциза и НДС).
  // Юрлицо всегда → полный расчёт (пошлина + акциз + НДС + сбор за оформление).
  const isGeneralOrder = normalizedParams.buyerType !== 'individual';

  let etpRUB = 0, stpRUB = 0;
  let dutyRUB = 0, exciseRUB = 0, vatRUB = 0;

  if (!isGeneralOrder) {
    if (isElectricType) {
      ({ stpRUB } = calcSTP(valueEUR));
    } else {
      ({ etpRUB } = calcETP(valueEUR, engineCC, ageGroupETP));
    }
  } else {
    ({ dutyRUB } = calcDuty(valueRUB, valueEUR, engineCC, ageGroupDuty, normalizedParams.engineType, normalizedParams.country));
    ({ exciseRUB } = calcExcise(powerHP));
    ({ vatRUB } = calcVAT(valueRUB, dutyRUB, exciseRUB));
  }

  const { recyclingRUB, isLgota } = calcRecycling(
    engineCC, powerHP, ageGroupRecycling,
    normalizedParams.buyerType, normalizedParams.engineType, normalizedParams.isPersonalUse
  );

  const { customsFeeRUB } = calcCustomsFee(valueRUB, isGeneralOrder);

  const totalCustoms = isGeneralOrder
    ? dutyRUB + exciseRUB + vatRUB + recyclingRUB + customsFeeRUB
    : etpRUB + stpRUB + recyclingRUB;
  const totalCost = valueRUB + totalCustoms;

  return {
    input: {
      buyerType: normalizedParams.buyerType,
      engineType: normalizedParams.engineType,
      engineCC,
      powerHP,
      year,
      valueRUB,
      valueEUR,
      country: normalizedParams.country,
      ageYears,
    },
    etp:          etpRUB,
    stp:          stpRUB,
    duty:         dutyRUB,
    excise:       exciseRUB,
    vat:          vatRUB,
    recycling:    recyclingRUB,
    isLgota,
    customsFee:   customsFeeRUB,
    isGeneralOrder,
    totalCustoms,
    totalCost,
  };
}

window.calculateAll = calculateAll;
