'use strict';

const CURRENCY_LABELS = {
  CNY: 'Курс CNY/RUB',
  USD: 'Курс USD/RUB',
  JPY: 'Курс JPY/RUB',
  KRW: 'Курс KRW/RUB',
  AED: 'Курс AED/RUB',
};

const POWER_HINT_ICE = 'Используется для расчёта акциза (юрлица) и утилизационного сбора.';
const POWER_HINT_EV  = 'Укажите 30-минутную мощность электродвигателей. Используется для расчёта акциза и утилизационного сбора.';

function initForm() {
  const currentYear = new Date().getFullYear();
  const form          = document.getElementById('calc-form');
  const engineTypeEl  = document.getElementById('input-engine-type');
  const fieldEngineCC = document.getElementById('field-engine-cc');
  const inputEngineCC = document.getElementById('input-engine-cc');
  const currencyEl    = document.getElementById('input-currency');
  const fieldRateCurr = document.getElementById('field-rate-currency');
  const labelRateCurr = document.getElementById('label-rate-currency');
  const hintPowerHP   = document.getElementById('hint-power-hp');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    onSubmit();
  });

  // --- Кнопки возраста ---
  const yearInput = document.getElementById('input-year');
  const AGE_YEAR_MAP = { new: currentYear - 1, mid: currentYear - 4, old: currentYear - 6 };
  // Дефолт: 3-5 лет
  yearInput.value = AGE_YEAR_MAP.mid;

  document.getElementById('age-toggle').addEventListener('click', function (e) {
    const btn = e.target.closest('.option-toggle__btn');
    if (!btn) return;
    document.querySelectorAll('#age-toggle .option-toggle__btn').forEach(b => b.classList.remove('option-toggle__btn--active'));
    btn.classList.add('option-toggle__btn--active');
    yearInput.value = AGE_YEAR_MAP[btn.dataset.age];
  });

  // --- Кнопки типа двигателя ---
  function applyEngineType(engineValue) {
    engineTypeEl.value = engineValue;
    engineTypeEl.dispatchEvent(new Event('change'));
  }

  document.getElementById('engine-toggle').addEventListener('click', function (e) {
    const btn = e.target.closest('.option-toggle__btn');
    if (!btn) return;
    document.querySelectorAll('#engine-toggle .option-toggle__btn').forEach(b => b.classList.remove('option-toggle__btn--active'));
    btn.classList.add('option-toggle__btn--active');
    applyEngineType(btn.dataset.engine);
  });

  // --- Изменение типа двигателя: CC и подсказка мощности ---
  engineTypeEl.addEventListener('change', function () {
    const isEV = engineTypeEl.value === 'electric' || engineTypeEl.value === 'hybrid_sequential';
    if (isEV) {
      fieldEngineCC.style.display = 'none';
      inputEngineCC.value = '0';
      if (hintPowerHP) hintPowerHP.textContent = POWER_HINT_EV;
    } else {
      fieldEngineCC.style.display = '';
      if (hintPowerHP) hintPowerHP.textContent = POWER_HINT_ICE;
    }
  });

  const inputRateCurr = document.getElementById('input-rate-currency');

  // --- Курс валюты ---
  function updateCurrencyField() {
    const cur = currencyEl.value;
    if (cur === 'EUR' || cur === 'RUB') {
      fieldRateCurr.style.display = 'none';
    } else {
      fieldRateCurr.style.display = '';
      labelRateCurr.textContent = CURRENCY_LABELS[cur] || ('Курс ' + cur + '/RUB');
      const defaultRate = window.CALC_RATES.CURRENCY[cur + '_RUB'];
      if (defaultRate !== undefined) inputRateCurr.value = defaultRate;
    }
  }

  currencyEl.addEventListener('change', updateCurrencyField);
  updateCurrencyField();

  const rateEurInput = document.getElementById('input-rate-eur');
  if (rateEurInput && !rateEurInput.value) {
    rateEurInput.value = window.CALC_RATES.CURRENCY.EUR_RUB;
  }
}

function getFormParams() {
  const isPersonalUse = document.getElementById('input-personal-use').checked;
  const buyerType     = isPersonalUse ? 'individual' : 'legal';
  const country       = document.getElementById('input-country').value;
  const year          = parseInt(document.getElementById('input-year').value, 10);
  const engineType    = document.getElementById('input-engine-type').value;
  const engineCC      = parseFloat(document.getElementById('input-engine-cc').value) || 0;
  const powerHP       = parseFloat(document.getElementById('input-power-hp').value) || 0;
  const value         = parseFloat(document.getElementById('input-value').value) || 0;
  const currency      = document.getElementById('input-currency').value;

  return { buyerType, isPersonalUse, country, year, engineType, engineCC, powerHP, value, currency };
}

function onSubmit() {
  document.getElementById('calc-error').style.display  = 'none';
  document.getElementById('calc-result').style.display = 'none';

  let params;
  try {
    params = getFormParams();
  } catch (e) {
    renderError(e.message);
    return;
  }

  const originals = {};

  const rateEurVal = parseFloat(document.getElementById('input-rate-eur').value);
  if (rateEurVal > 0) {
    originals.EUR_RUB = window.CALC_RATES.CURRENCY.EUR_RUB;
    window.CALC_RATES.CURRENCY.EUR_RUB = rateEurVal;
  }

  const cur = params.currency;
  if (cur !== 'EUR' && cur !== 'RUB') {
    const rateCurrVal = parseFloat(document.getElementById('input-rate-currency').value);
    if (rateCurrVal > 0) {
      const key = cur + '_RUB';
      originals[key] = window.CALC_RATES.CURRENCY[key];
      window.CALC_RATES.CURRENCY[key] = rateCurrVal;
    }
  }

  try {
    const result = window.calculateAll(params);
    renderResult(result);
  } catch (e) {
    renderError(e.message);
  } finally {
    for (const key of Object.keys(originals)) {
      window.CALC_RATES.CURRENCY[key] = originals[key];
    }
  }
}

function fmt(num) {
  return Math.round(num).toLocaleString('ru-RU') + ' руб.';
}

function renderResult(result) {
  const showComponents = result.isGeneralOrder;

  document.querySelectorAll('.individual-only').forEach(function (el) {
    el.style.display = showComponents ? 'none' : '';
  });
  document.querySelectorAll('.legal-only').forEach(function (el) {
    el.style.display = showComponents ? '' : 'none';
  });

  const etpLabelEl = document.querySelector('#row-etp .result-row__label');
  if (etpLabelEl) {
    etpLabelEl.textContent = result.stp > 0 ? 'СТП (электромобиль)' : 'ЕТП';
  }
  document.getElementById('val-etp').textContent         = fmt(result.etp + result.stp);
  document.getElementById('val-duty').textContent        = fmt(result.duty);
  document.getElementById('val-excise').textContent      = fmt(result.excise);
  document.getElementById('val-vat').textContent         = fmt(result.vat);
  document.getElementById('val-customs-fee').textContent = fmt(result.customsFee);
  document.getElementById('val-recycling').textContent   = fmt(result.recycling) + (result.isLgota ? ' (льготный)' : '');
  document.getElementById('val-total-customs').textContent = fmt(result.totalCustoms);
  document.getElementById('val-car-value').textContent   = fmt(result.input.valueRUB);
  document.getElementById('val-total-cost').textContent  = fmt(result.totalCost);

  document.getElementById('calc-result').style.display = '';
  document.getElementById('calc-error').style.display  = 'none';
  document.getElementById('calc-result').scrollIntoView({ behavior: 'smooth' });
}

function renderError(message) {
  const errEl = document.getElementById('calc-error');
  errEl.textContent = message;
  errEl.style.display = '';
  document.getElementById('calc-result').style.display = 'none';
}

let chatHistory = [];

function initChat() {
  const chatForm  = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');

  chatForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';
    sendMessage(text);
  });

  chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;
      chatInput.value = '';
      sendMessage(text);
    }
  });

  appendMessage('assistant', 'Привет! Опишите какой автомобиль хотите ввезти - я рассчитаю таможенные платежи. Например: "Хочу BYD Atto 3 2023 года из Китая, я физлицо"');
}

async function sendMessage(userText) {
  if (!userText) return;

  const chatInput = document.getElementById('chat-input');
  const submitBtn = document.getElementById('btn-chat-send');

  submitBtn.disabled = true;
  chatInput.disabled = true;

  chatHistory.push({ role: 'user', content: userText });
  appendMessage('user', userText);

  const loaderEl = appendLoader();

  let res;
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory }),
    });
  } catch (_) {
    loaderEl.remove();
    appendMessage('assistant', 'Ошибка соединения. Проверьте интернет и попробуйте снова.');
    submitBtn.disabled = false;
    chatInput.disabled = false;
    return;
  }

  if (!res.ok) {
    loaderEl.remove();
    appendMessage('assistant', 'Сервер временно недоступен. Попробуйте снова через несколько секунд.');
    submitBtn.disabled = false;
    chatInput.disabled = false;
    return;
  }

  let data;
  try {
    data = await res.json();
  } catch (_) {
    loaderEl.remove();
    appendMessage('assistant', 'Не удалось прочитать ответ сервера. Попробуйте снова.');
    submitBtn.disabled = false;
    chatInput.disabled = false;
    return;
  }

  loaderEl.remove();
  await handleAIResponse(data.content || '');

  submitBtn.disabled = false;
  chatInput.disabled = false;
}

async function handleAIResponse(text) {
  if (text.includes('##CALCULATE##')) {
    chatHistory.push({ role: 'assistant', content: text });

    const afterMarker = text.split('##CALCULATE##')[1] || '';
    const braceStart = afterMarker.indexOf('{');
    const braceEnd = afterMarker.lastIndexOf('}');
    if (braceStart === -1 || braceEnd < braceStart) {
      appendMessage('assistant', 'Произошла ошибка разбора параметров. Попробуйте описать автомобиль ещё раз.');
      return;
    }
    const jsonStr = afterMarker.slice(braceStart, braceEnd + 1);

    let params;
    try {
      params = JSON.parse(jsonStr);
    } catch (_) {
      appendMessage('assistant', 'Произошла ошибка разбора параметров. Попробуйте описать автомобиль ещё раз.');
      return;
    }

    params.isPersonalUse = (params.buyerType === 'individual');

    let result;
    try {
      result = window.calculateAll(params);
    } catch (e) {
      appendMessage('assistant', e.message);
      return;
    }

    const summary = formatCalculationForAI(result);
    chatHistory.push({ role: 'user', content: 'Вот результаты расчёта:\n' + summary + '\n\nОбъясни пользователю на русском языке.' });

    const loaderEl2 = appendLoader();

    let res2;
    try {
      res2 = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory }),
      });
    } catch (_) {
      loaderEl2.remove();
      chatHistory.pop();
      appendMessage('assistant', 'Ошибка соединения. Проверьте интернет и попробуйте снова.');
      return;
    }

    if (!res2.ok) {
      loaderEl2.remove();
      chatHistory.pop();
      appendMessage('assistant', 'Сервер временно недоступен. Попробуйте снова через несколько секунд.');
      return;
    }

    let data2;
    try {
      data2 = await res2.json();
    } catch (_) {
      loaderEl2.remove();
      chatHistory.pop();
      appendMessage('assistant', 'Не удалось прочитать ответ сервера. Попробуйте снова.');
      return;
    }

    loaderEl2.remove();

    const responseText = data2.content || 'Расчёт выполнен. Если нужны пояснения - спросите.';
    chatHistory.push({ role: 'assistant', content: responseText });
    appendMessage('assistant', responseText);

  } else {
    chatHistory.push({ role: 'assistant', content: text });
    appendMessage('assistant', text);
  }
}

function appendMessage(role, text) {
  const chatMessages = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'message message--' + role;
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

function appendLoader() {
  const chatMessages = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'message message--assistant message--loading';
  div.appendChild(document.createElement('span'));
  div.appendChild(document.createElement('span'));
  div.appendChild(document.createElement('span'));
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

function formatCalculationForAI(result) {
  const inp = result.input;
  const buyerLabel = inp.buyerType === 'individual' ? 'физлицо' : 'юрлицо';

  const lines = [
    'Параметры: ' + buyerLabel + ', ' + inp.country + ', ' + inp.year + ' г., ' +
      inp.engineType + ', ' + inp.engineCC + ' куб.см, ' + inp.powerHP + ' л.с., стоимость ' + fmt(inp.valueRUB),
    'Результаты:',
  ];

  if (result.isGeneralOrder) {
    lines.push('- Пошлина: ' + fmt(result.duty));
    lines.push('- Акциз: ' + fmt(result.excise));
    lines.push('- НДС: ' + fmt(result.vat));
    lines.push('- Таможенный сбор: ' + fmt(result.customsFee));
  } else {
    lines.push('- ЕТП: ' + fmt(result.etp + result.stp));
  }

  lines.push('- Утилизационный сбор: ' + fmt(result.recycling) + (result.isLgota ? ' (льготный)' : ''));
  lines.push('- Итого на таможне: ' + fmt(result.totalCustoms));
  lines.push('- Полная стоимость «под ключ»: ' + fmt(result.totalCost));

  return lines.join('\n');
}

document.addEventListener('DOMContentLoaded', function () {
  initForm();
  initChat();
});
