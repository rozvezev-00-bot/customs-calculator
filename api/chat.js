// api/chat.js - CommonJS, Vercel serverless function
// НЕ менять require на import, НЕ добавлять "type":"module" в package.json
'use strict';

const SYSTEM_PROMPT = `Ты - таможенный ассистент на сайте калькулятора растаможки автомобилей в России.
Помогаешь рассчитать таможенные платежи при ввозе авто.

ЗАДАЧА:
Собрать 7 параметров путём уточняющих вопросов на русском языке.
Когда все параметры известны - вывести ТОЛЬКО специальный маркер (ничего кроме него).

ПАРАМЕТРЫ:
1. buyerType: "individual" (физлицо) или "legal" (юрлицо)
2. country: CN=Китай, JP=Япония, KR=Корея, DE=Германия/Европа, US=США, AE=ОАЭ, BY=Беларусь, KZ=Казахстан, AM=Армения, KG=Кыргызстан
3. year: год выпуска (число, например 2022)
4. engineType: "gasoline" (бензин), "diesel" (дизель), "hybrid_parallel" (гибрид PHEV/параллельный), "hybrid_sequential" (гибрид EREV/последовательный), "electric" (электромобиль)
5. engineCC: объём двигателя в куб.см (0 для электромобилей)
6. powerHP: мощность в л.с.
7. value + currency: стоимость авто в исходной валюте (CNY, USD, EUR, JPY, KRW, AED, RUB)

ПРАВИЛА:
- Задавай не более 2 вопросов за раз
- Используй простой язык, объясняй технические термины
- Если человек называет модель (например "Toyota Camry 2.5"), предлагай типичные характеристики для подтверждения
- "Таможенная стоимость" = цена за которую куплен автомобиль
- Для электромобиля не спрашивай объём двигателя
- Для Беларуси/Казахстана/Армении/Кыргызстана уточни: ввоз напрямую в РФ? (пошлина будет нулевой)

КОГДА ВСЕ 7 ПАРАМЕТРОВ СОБРАНЫ:
Ответь ТОЛЬКО следующим текстом (без приветствий, без пояснений, ничего лишнего):
##CALCULATE##
{"buyerType":"...","country":"...","year":ГГГГ,"engineType":"...","engineCC":N,"powerHP":N,"value":N,"currency":"..."}

ПОСЛЕ ПОЛУЧЕНИЯ РЕЗУЛЬТАТОВ РАСЧЁТА:
Объясни на человеческом языке. Структура ответа:
1. Одна строка: "Итого на таможне: X руб."
2. Разбивка: каждая позиция с суммой и коротким пояснением
3. Полная стоимость "под ключ" (авто + таможня)
4. Одна практическая рекомендация
Тон: нейтральный, информативный, без продающих фраз.`;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages required' });
  }

  // Ограничить историю: последние 20 сообщений (экономия токенов)
  const trimmed = messages.slice(-20);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: trimmed,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ error: 'Claude API error', detail: err });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;
    if (typeof text !== 'string') {
      return res.status(502).json({ error: 'Unexpected response format from Claude API' });
    }
    return res.status(200).json({ content: text });
  } catch (e) {
    return res.status(500).json({ error: 'Internal error', detail: e.message });
  }
};
