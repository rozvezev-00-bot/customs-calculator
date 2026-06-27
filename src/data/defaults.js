'use strict';

// Все ставки таможенных платежей. Источник: business/life-metrics.md
// Обновлять при изменении законодательства. Последнее обновление: 2026-06-28.
// Курсы валют обновлены по ЦБ РФ на 28.06.2026: EUR=87.4027, CNY=11.3359, USD=77.0611.

window.CALC_RATES = {

  // ─── КУРСЫ ВАЛЮТ (LIVE - обновлять из ЦБ РФ) ────────────────────────────
  // EUR/RUB - ключевой: все платежи в EUR конвертируются через него
  // Обновлено по ЦБ РФ на 28.06.2026
  CURRENCY: {
    EUR_RUB: 87.4027,
    CNY_RUB: 11.3359,
    USD_RUB: 77.0611,
    JPY_RUB: 0.52,
    KRW_RUB: 0.055,
    AED_RUB: 21.0,  // Дирхам ОАЭ - LIVE, обновлять из ЦБ РФ
  },

  // ─── СТРАНЫ ЕАЭС (нулевая пошлина для юрлиц) ────────────────────────────
  EAEU: ['BY', 'KZ', 'AM', 'KG'],

  // ─── ЕТП ФИЗЛИЦА, АВТО 0-3 ЛЕТ (бензин, дизель, mild hybrid) ───────────
  // Берётся MAX из: стоимость_EUR × percent ИЛИ объём_куб_см × minPerCC
  // Источник: Решение Совета ЕЭК №107 от 20.12.2017, Приложение №3
  ETP_NEW: [
    { maxEUR: 8500,    percent: 0.54, minPerCC: 2.5  },
    { maxEUR: 16700,   percent: 0.48, minPerCC: 3.5  },
    { maxEUR: 42300,   percent: 0.48, minPerCC: 5.5  },
    { maxEUR: 84500,   percent: 0.48, minPerCC: 7.5  },
    { maxEUR: 169000,  percent: 0.48, minPerCC: 15.0 },
    { maxEUR: Infinity, percent: 0.48, minPerCC: 20.0 },
  ],

  // ─── ЕТП ФИЗЛИЦА, АВТО 3-5 ЛЕТ ─────────────────────────────────────────
  // Только объём_куб_см × eurPerCC. Стоимость не влияет.
  ETP_MID: [
    { maxCC: 1000,     eurPerCC: 1.5 },
    { maxCC: 1500,     eurPerCC: 1.7 },
    { maxCC: 1800,     eurPerCC: 2.5 },
    { maxCC: 2300,     eurPerCC: 2.7 },
    { maxCC: 3000,     eurPerCC: 3.0 },
    { maxCC: Infinity, eurPerCC: 3.6 },
  ],

  // ─── ЕТП ФИЗЛИЦА, АВТО 5+ ЛЕТ ──────────────────────────────────────────
  ETP_OLD: [
    { maxCC: 1000,     eurPerCC: 3.0 },
    { maxCC: 1500,     eurPerCC: 3.2 },
    { maxCC: 1800,     eurPerCC: 3.5 },
    { maxCC: 2300,     eurPerCC: 4.8 },
    { maxCC: 3000,     eurPerCC: 5.0 },
    { maxCC: Infinity, eurPerCC: 5.7 },
  ],

  // ─── СТП ДЛЯ ЭЛЕКТРОМОБИЛЕЙ ФИЗЛИЦ (вместо ЕТП) ────────────────────────
  // СТП = стоимость_EUR × EV_STP_RATE × EUR_RUB
  // Источник: Решение Совета ЕЭК №107
  EV_STP_RATE: 0.15,

  // ─── ПОШЛИНА ЮРЛИЦ, АВТО 0-3 ГОДА ──────────────────────────────────────
  // Единая адвалорная ставка для всех типов ДВС и объёмов
  // Источник: ЕТТ ЕАЭС, группа 87, код 8703
  DUTY_NEW_RATE: 0.15,

  // ─── ПОШЛИНА ЮРЛИЦ, АВТО 0-3 ГОДА, ЭЛЕКТРО ─────────────────────────────
  // Льгота 0% закончилась 31.12.2024. Стандартная ставка с 2025.
  DUTY_EV_RATE: 0.15,

  // ─── ПОШЛИНА ЮРЛИЦ, АВТО 3-7 ЛЕТ (бензин и дизель) ────────────────────
  // MAX из: стоимость_EUR × percent ИЛИ объём_куб_см × minPerCC
  // Источник: ЕТТ ЕАЭС, код 8703 (подкоды .x91)
  DUTY_USED: [
    { maxCC: 1000,     percent: 0.20, minPerCC: 0.36 },
    { maxCC: 1500,     percent: 0.20, minPerCC: 0.40 },
    { maxCC: 1800,     percent: 0.20, minPerCC: 0.36 },
    { maxCC: 2300,     percent: 0.20, minPerCC: 0.44 },
    { maxCC: 3000,     percent: 0.20, minPerCC: 0.44 },
    { maxCC: Infinity, percent: 0.20, minPerCC: 0.80 },
  ],

  // ─── ПОШЛИНА ЮРЛИЦ, АВТО 7+ ЛЕТ (бензин и дизель) ─────────────────────
  // Только специфическая ставка EUR/куб.см, без процентной составляющей
  // Источник: ЕТТ ЕАЭС, код 8703 (подкоды .x99)
  DUTY_OLD: [
    { maxCC: 1000,     eurPerCC: 1.40 },
    { maxCC: 1500,     eurPerCC: 1.50 },
    { maxCC: 1800,     eurPerCC: 1.60 },
    { maxCC: 2300,     eurPerCC: 2.20 },
    { maxCC: 3000,     eurPerCC: 2.20 },
    { maxCC: Infinity, eurPerCC: 3.20 },
  ],

  // ─── АКЦИЗ (2025 = 2026, одинаковые ставки) ─────────────────────────────
  // Источник: НК РФ ст. 193, ФЗ №425-ФЗ от 28.11.2025
  // Проверено по consultant.ru 2026-06-27
  // Для физлиц акциза нет - включён в ЕТП
  EXCISE: [
    { maxHP: 90,       rubPerHP: 0    },
    { maxHP: 150,      rubPerHP: 64   },
    { maxHP: 200,      rubPerHP: 613  },
    { maxHP: 300,      rubPerHP: 1004 },
    { maxHP: 400,      rubPerHP: 1711 },
    { maxHP: 500,      rubPerHP: 1771 },
    { maxHP: Infinity, rubPerHP: 1829 },
  ],

  // ─── НДС ─────────────────────────────────────────────────────────────────
  // База: стоимость_RUB + пошлина_RUB + акциз_RUB
  // НК РФ ст. 160, ст. 164, ФЗ №176-ФЗ от 12.07.2024. Для физлиц не применяется (включён в ЕТП).
  // С 01.01.2026 ставка повышена с 20% до 22%.
  VAT_RATE: 0.22,

  // ─── УТИЛИЗАЦИОННЫЙ СБОР ─────────────────────────────────────────────────
  // Постановление Правительства РФ №1713 от 01.11.2025 (в силе с 01.12.2025)
  // Данные проверены по оригиналу PDF (publication.pravo.gov.ru, 2026-06-27)
  // Базовая ставка для легковых категории М1
  RECYCLING_BASE: 20000,

  // Льготные коэффициенты физлиц (мощность ≤ 160 л.с. для ДВС, ≤ 80 л.с. для ЭД,
  // объём ≤ 3000 куб.см, личное пользование, не более 1 авто в год)
  RECYCLING_ЛЬГОТА_NEW:  0.17,   // 0-3 года → 3 400 руб.
  RECYCLING_ЛЬГОТА_USED: 0.26,   // 3+ лет  → 5 200 руб.

  // Мощностной порог льготы
  RECYCLING_ЛЬГОТА_HP_ICE: 160,  // для ДВС и гибридов
  RECYCLING_ЛЬГОТА_HP_EV:  80,   // для электромобилей
  RECYCLING_ЛЬГОТА_CC_MAX: 3000, // максимальный объём для льготы (куб.см)

  // coeff_indiv: null  → физлицо получает льготный коэффициент (RECYCLING_ЛЬГОТА_NEW/USED)
  // coeff_indiv: число → физлицо платит коммерческий коэффициент (льгота не применяется)
  // coeff_legal        → коэффициент для юрлиц (льгот нет)

  // ─── ДВС до 1 000 куб.см ─────────────────────────────────────────────────
  // Источник: Постановление №1713, Раздел I, п.2 (до 1 000 куб.см)
  RECYCLING_0_1L_NEW: [
    { maxHP: 160,      coeff_indiv: null,  coeff_legal: 14.88 },
    { maxHP: 190,      coeff_indiv: 15.36, coeff_legal: 15.36 },
    { maxHP: 220,      coeff_indiv: 15.84, coeff_legal: 15.84 },
    { maxHP: Infinity, coeff_indiv: 17.28, coeff_legal: 17.28 },
  ],

  RECYCLING_0_1L_USED: [
    { maxHP: 160,      coeff_indiv: null,  coeff_legal: 27.60 },
    { maxHP: 190,      coeff_indiv: 28.44, coeff_legal: 28.44 },
    { maxHP: 220,      coeff_indiv: 29.28, coeff_legal: 29.28 },
    { maxHP: Infinity, coeff_indiv: 30.12, coeff_legal: 30.12 },
  ],

  // ─── ДВС 1 000-2 000 куб.см ──────────────────────────────────────────────
  // Источник: Постановление №1713, Раздел I, п.2 (1 000-2 000 куб.см)
  RECYCLING_1_2L_NEW: [
    { maxHP: 160,      coeff_indiv: null,   coeff_legal: 40.04  },
    { maxHP: 190,      coeff_indiv: 45.00,  coeff_legal: 45.00  },
    { maxHP: 220,      coeff_indiv: 47.64,  coeff_legal: 47.64  },
    { maxHP: 250,      coeff_indiv: 50.52,  coeff_legal: 50.52  },
    { maxHP: 280,      coeff_indiv: 57.12,  coeff_legal: 57.12  },
    { maxHP: 310,      coeff_indiv: 64.56,  coeff_legal: 64.56  },
    { maxHP: 340,      coeff_indiv: 72.96,  coeff_legal: 72.96  },
    { maxHP: 370,      coeff_indiv: 83.16,  coeff_legal: 83.16  },
    { maxHP: 400,      coeff_indiv: 94.80,  coeff_legal: 94.80  },
    { maxHP: 430,      coeff_indiv: 108.00, coeff_legal: 108.00 },
    { maxHP: 460,      coeff_indiv: 123.24, coeff_legal: 123.24 },
    { maxHP: 500,      coeff_indiv: 140.40, coeff_legal: 140.40 },
    { maxHP: Infinity, coeff_indiv: 160.08, coeff_legal: 160.08 },
  ],

  RECYCLING_1_2L_USED: [
    { maxHP: 160,      coeff_indiv: null,   coeff_legal: 70.44  },
    { maxHP: 190,      coeff_indiv: 74.64,  coeff_legal: 74.64  },
    { maxHP: 220,      coeff_indiv: 79.20,  coeff_legal: 79.20  },
    { maxHP: 250,      coeff_indiv: 83.88,  coeff_legal: 83.88  },
    { maxHP: 280,      coeff_indiv: 91.92,  coeff_legal: 91.92  },
    { maxHP: 310,      coeff_indiv: 100.56, coeff_legal: 100.56 },
    { maxHP: 340,      coeff_indiv: 110.16, coeff_legal: 110.16 },
    { maxHP: 370,      coeff_indiv: 120.60, coeff_legal: 120.60 },
    { maxHP: 400,      coeff_indiv: 132.00, coeff_legal: 132.00 },
    { maxHP: 430,      coeff_indiv: 144.60, coeff_legal: 144.60 },
    { maxHP: 460,      coeff_indiv: 158.40, coeff_legal: 158.40 },
    { maxHP: 500,      coeff_indiv: 173.40, coeff_legal: 173.40 },
    { maxHP: Infinity, coeff_indiv: 189.84, coeff_legal: 189.84 },
  ],

  // ─── ДВС 2 000-3 000 куб.см ──────────────────────────────────────────────
  // Источник: Постановление №1713, Раздел I, п.2 (2 000-3 000 куб.см)
  RECYCLING_2_3L_NEW: [
    { maxHP: 160,      coeff_indiv: null,   coeff_legal: 112.52 },
    { maxHP: 190,      coeff_indiv: 115.34, coeff_legal: 115.34 },
    { maxHP: 220,      coeff_indiv: 118.20, coeff_legal: 118.20 },
    { maxHP: 250,      coeff_indiv: 120.12, coeff_legal: 120.12 },
    { maxHP: 280,      coeff_indiv: 126.00, coeff_legal: 126.00 },
    { maxHP: 310,      coeff_indiv: 131.04, coeff_legal: 131.04 },
    { maxHP: 340,      coeff_indiv: 136.32, coeff_legal: 136.32 },
    { maxHP: 370,      coeff_indiv: 141.72, coeff_legal: 141.72 },
    { maxHP: 400,      coeff_indiv: 147.48, coeff_legal: 147.48 },
    { maxHP: 430,      coeff_indiv: 153.36, coeff_legal: 153.36 },
    { maxHP: 460,      coeff_indiv: 159.48, coeff_legal: 159.48 },
    { maxHP: 500,      coeff_indiv: 165.84, coeff_legal: 165.84 },
    { maxHP: Infinity, coeff_indiv: 172.44, coeff_legal: 172.44 },
  ],

  RECYCLING_2_3L_USED: [
    { maxHP: 160,      coeff_indiv: null,   coeff_legal: 170.36 },
    { maxHP: 190,      coeff_indiv: 172.80, coeff_legal: 172.80 },
    { maxHP: 220,      coeff_indiv: 175.08, coeff_legal: 175.08 },
    { maxHP: 250,      coeff_indiv: 177.60, coeff_legal: 177.60 },
    { maxHP: 280,      coeff_indiv: 183.00, coeff_legal: 183.00 },
    { maxHP: 310,      coeff_indiv: 188.52, coeff_legal: 188.52 },
    { maxHP: 340,      coeff_indiv: 193.68, coeff_legal: 193.68 },
    { maxHP: 370,      coeff_indiv: 199.08, coeff_legal: 199.08 },
    { maxHP: 400,      coeff_indiv: 204.72, coeff_legal: 204.72 },
    { maxHP: 430,      coeff_indiv: 210.48, coeff_legal: 210.48 },
    { maxHP: 460,      coeff_indiv: 216.36, coeff_legal: 216.36 },
    { maxHP: 500,      coeff_indiv: 222.36, coeff_legal: 222.36 },
    { maxHP: Infinity, coeff_indiv: 228.60, coeff_legal: 228.60 },
  ],

  // ─── ДВС 3 000-3 500 куб.см ──────────────────────────────────────────────
  // Льгота физлиц НЕ применяется: объём > 3 000 куб.см
  // Источник: Постановление №1713, Раздел I, п.2 (3 000-3 500 куб.см)
  RECYCLING_3_3_5L_NEW: [
    { maxHP: 160,      coeff_indiv: 129.20, coeff_legal: 129.20 },
    { maxHP: 190,      coeff_indiv: 131.76, coeff_legal: 131.76 },
    { maxHP: 220,      coeff_indiv: 134.40, coeff_legal: 134.40 },
    { maxHP: 250,      coeff_indiv: 137.16, coeff_legal: 137.16 },
    { maxHP: 280,      coeff_indiv: 140.52, coeff_legal: 140.52 },
    { maxHP: 310,      coeff_indiv: 144.00, coeff_legal: 144.00 },
    { maxHP: 340,      coeff_indiv: 151.92, coeff_legal: 151.92 },
    { maxHP: 370,      coeff_indiv: 160.32, coeff_legal: 160.32 },
    { maxHP: 400,      coeff_indiv: 169.20, coeff_legal: 169.20 },
    { maxHP: 430,      coeff_indiv: 178.44, coeff_legal: 178.44 },
    { maxHP: 460,      coeff_indiv: 188.28, coeff_legal: 188.28 },
    { maxHP: 500,      coeff_indiv: 198.60, coeff_legal: 198.60 },
    { maxHP: Infinity, coeff_indiv: 209.52, coeff_legal: 209.52 },
  ],

  RECYCLING_3_3_5L_USED: [
    { maxHP: 160,      coeff_indiv: 197.81, coeff_legal: 197.81 },
    { maxHP: 190,      coeff_indiv: 200.04, coeff_legal: 200.04 },
    { maxHP: 220,      coeff_indiv: 202.20, coeff_legal: 202.20 },
    { maxHP: 250,      coeff_indiv: 204.36, coeff_legal: 204.36 },
    { maxHP: 280,      coeff_indiv: 207.24, coeff_legal: 207.24 },
    { maxHP: 310,      coeff_indiv: 212.40, coeff_legal: 212.40 },
    { maxHP: 340,      coeff_indiv: 217.80, coeff_legal: 217.80 },
    { maxHP: 370,      coeff_indiv: 224.28, coeff_legal: 224.28 },
    { maxHP: 400,      coeff_indiv: 231.00, coeff_legal: 231.00 },
    { maxHP: 430,      coeff_indiv: 237.96, coeff_legal: 237.96 },
    { maxHP: 460,      coeff_indiv: 245.04, coeff_legal: 245.04 },
    { maxHP: 500,      coeff_indiv: 252.48, coeff_legal: 252.48 },
    { maxHP: Infinity, coeff_indiv: 260.04, coeff_legal: 260.04 },
  ],

  // ─── ДВС свыше 3 500 куб.см ──────────────────────────────────────────────
  // Льгота физлиц НЕ применяется: объём > 3 000 куб.см
  // Источник: Постановление №1713, Раздел I, п.2 (свыше 3 500 куб.см)
  RECYCLING_3_5L_PLUS_NEW: [
    { maxHP: 160,      coeff_indiv: 164.53, coeff_legal: 164.53 },
    { maxHP: 190,      coeff_indiv: 167.28, coeff_legal: 167.28 },
    { maxHP: 220,      coeff_indiv: 170.16, coeff_legal: 170.16 },
    { maxHP: 250,      coeff_indiv: 173.04, coeff_legal: 173.04 },
    { maxHP: 280,      coeff_indiv: 176.52, coeff_legal: 176.52 },
    { maxHP: 310,      coeff_indiv: 180.00, coeff_legal: 180.00 },
    { maxHP: 340,      coeff_indiv: 186.36, coeff_legal: 186.36 },
    { maxHP: 370,      coeff_indiv: 192.88, coeff_legal: 192.88 },
    { maxHP: 400,      coeff_indiv: 199.68, coeff_legal: 199.68 },
    { maxHP: 430,      coeff_indiv: 206.64, coeff_legal: 206.64 },
    { maxHP: 460,      coeff_indiv: 213.84, coeff_legal: 213.84 },
    { maxHP: 500,      coeff_indiv: 221.28, coeff_legal: 221.28 },
    { maxHP: Infinity, coeff_indiv: 229.08, coeff_legal: 229.08 },
  ],

  RECYCLING_3_5L_PLUS_USED: [
    { maxHP: 160,      coeff_indiv: 216.29, coeff_legal: 216.29 },
    { maxHP: 190,      coeff_indiv: 219.48, coeff_legal: 219.48 },
    { maxHP: 220,      coeff_indiv: 222.84, coeff_legal: 222.84 },
    { maxHP: 250,      coeff_indiv: 226.20, coeff_legal: 226.20 },
    { maxHP: 280,      coeff_indiv: 231.36, coeff_legal: 231.36 },
    { maxHP: 310,      coeff_indiv: 236.64, coeff_legal: 236.64 },
    { maxHP: 340,      coeff_indiv: 249.60, coeff_legal: 249.60 },
    { maxHP: 370,      coeff_indiv: 263.40, coeff_legal: 263.40 },
    { maxHP: 400,      coeff_indiv: 277.92, coeff_legal: 277.92 },
    { maxHP: 430,      coeff_indiv: 293.16, coeff_legal: 293.16 },
    { maxHP: 460,      coeff_indiv: 309.36, coeff_legal: 309.36 },
    { maxHP: 500,      coeff_indiv: 326.40, coeff_legal: 326.40 },
    { maxHP: Infinity, coeff_indiv: 344.28, coeff_legal: 344.28 },
  ],

  // ─── ЭЛЕКТРОМОБИЛИ И ПОСЛЕДОВАТЕЛЬНЫЕ ГИБРИДЫ (EREV) ─────────────────────
  // Таблица по мощности ЭД (30-минутный режим)
  // coeff_indiv: null → физлица ≤ 80 л.с. получают льготный коэффициент
  // Источник: Постановление №1713, Раздел I, пп.1 и 3 (ЭВ)
  RECYCLING_EV_NEW: [
    { maxHP: 80,       coeff_indiv: null,   coeff_legal: 40.04  },
    { maxHP: 100,      coeff_indiv: 49.56,  coeff_legal: 49.56  },
    { maxHP: 130,      coeff_indiv: 65.88,  coeff_legal: 65.88  },
    { maxHP: 160,      coeff_indiv: 78.00,  coeff_legal: 78.00  },
    { maxHP: 190,      coeff_indiv: 92.40,  coeff_legal: 92.40  },
    { maxHP: 220,      coeff_indiv: 109.68, coeff_legal: 109.68 },
    { maxHP: 250,      coeff_indiv: 129.96, coeff_legal: 129.96 },
    { maxHP: 280,      coeff_indiv: 153.96, coeff_legal: 153.96 },
    { maxHP: Infinity, coeff_indiv: 182.40, coeff_legal: 182.40 },
  ],

  RECYCLING_EV_USED: [
    { maxHP: 80,       coeff_indiv: null,   coeff_legal: 70.44  },
    { maxHP: 100,      coeff_indiv: 82.08,  coeff_legal: 82.08  },
    { maxHP: 130,      coeff_indiv: 95.64,  coeff_legal: 95.64  },
    { maxHP: 160,      coeff_indiv: 111.36, coeff_legal: 111.36 },
    { maxHP: 190,      coeff_indiv: 129.72, coeff_legal: 129.72 },
    { maxHP: 220,      coeff_indiv: 151.20, coeff_legal: 151.20 },
    { maxHP: 250,      coeff_indiv: 176.16, coeff_legal: 176.16 },
    { maxHP: 280,      coeff_indiv: 205.20, coeff_legal: 205.20 },
    { maxHP: Infinity, coeff_indiv: 239.04, coeff_legal: 239.04 },
  ],

  // ─── ТАМОЖЕННЫЙ СБОР ЗА ОФОРМЛЕНИЕ (с 01.01.2026) ───────────────────────
  // Постановление Правительства РФ №1638 от 23.10.2025
  // ВНИМАНИЕ: физлица по ПТД могут быть освобождены - уточнить.
  // В v1 показывать только для юрлиц.
  CUSTOMS_FEE: [
    { maxRUB: 200000,    fee: 1231  },
    { maxRUB: 450000,    fee: 2462  },
    { maxRUB: 1200000,   fee: 4924  },
    { maxRUB: 2700000,   fee: 13541 },
    { maxRUB: 4200000,   fee: 18465 },
    { maxRUB: 5500000,   fee: 21344 },
    { maxRUB: 10000000,  fee: 49240 },
    { maxRUB: Infinity,  fee: 73860 },
  ],

  // ─── ДОПОЛНИТЕЛЬНЫЕ РАСХОДЫ (не таможенные, показывать в UI) ────────────
  EXTRA_COSTS: {
    era_glonass_min: 17000,
    era_glonass_max: 40000,
    sbkts_min: 14000,
    sbkts_max: 30000,
    svh_per_day_min: 1000,
    svh_per_day_max: 3000,
    broker_min: 15000,
    broker_max: 50000,
  },
};
