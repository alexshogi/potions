const fs = require('fs');
const crypto = require('crypto');
const ImageKit = require('imagekit');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const { loadImage, createCanvas, registerFont } = require('canvas');

const imagekit = new ImageKit({
  publicKey : 'public_vv9fDwLAn+t7d6+Swu447nLgnGk=',
  privateKey : 'private_cVsoGVYZRkPsPnpKdwj6kzG3gx0=',
  urlEndpoint : 'https://ik.imagekit.io/8sjtul9r9'
});

const cards = require('./cards.json');

const items = cards.items;

const items1 = items.filter(item => item.score === '1');
const items2 = items.filter(item => item.score === '2');

const generateSequence = async () => {
  const sequenceLength = 7;
  const items1amount = 3;
  const items2amount = 4;
  const maxPoints = 50;

  const randomNumbers1 = [];
  const randomNumbers2 = [];

  let sequence = [];

  while(randomNumbers1.length < items1amount) {
    let r = Math.floor(Math.random() * items1.length) + 1;
    if (randomNumbers1.indexOf(r) === -1) randomNumbers1.push(r);
  }

  while(randomNumbers2.length < items2amount) {
    let r = Math.floor(Math.random() * items2.length) + 1;
    if (randomNumbers2.indexOf(r) === -1) randomNumbers2.push(r);
  }

  for (let number of randomNumbers1) {
    sequence.push(items1[number - 1]);
  }

  for (let number of randomNumbers2) {
    sequence.push(items2[number - 1]);
  }

  let totalPoints = 0;

  const random = (min, max) => Math.floor(Math.random() * (max - min)) + min;

  for (let i = 0; i < sequence.length; i++) {
    let points = random(1, 10);
    if (totalPoints + points > maxPoints) {
      sequence[i].points = maxPoints - totalPoints;
      totalPoints += maxPoints - totalPoints;
    } else {
      sequence[i].points = points;
      totalPoints += points;
    }
  }

  if (totalPoints < maxPoints) {
    let sMany = 0;

    for (let i = 0; i < sequence.length - 1; i++) {
      sMany += sequence[i].points;
    }

    sequence[sequenceLength - 1].points = maxPoints - sMany;
  }

  sequence = [...sequence];

  registerFont(path.resolve('./LunchBoxSlab.otf'), { family: 'LunchBoxSlab' })
  const width = 872;
  const height = 1280;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');

  context.fillRect(0, 0, width, height);
  await loadImage('./images/sequence.jpeg').then((data) => {
    context.drawImage(data, 0, 0, width, height);

    context.font = 'bold 44pt LunchBoxSlab';
    context.textBaseline = 'top';

    let x = 60;
    let y = 200;
    const lineheight = 50;
    const space = 85;

    for (const item of sequence) {
      context.fillStyle = '#688755';
      context.fillRect(x, y - 10, 70, 70);

      context.textAlign = 'center';
      context.fillStyle = '#f2dc6f';
      const points = item.points;
      context.fillText(points, x + 35, y);

      context.textAlign = 'left';
      context.fillStyle = '#272727';
      const itemText = item.title;
      const lines = itemText.split('\n');
      for (let i = 0; i < lines.length; i++) {
        context.fillText(lines[i], x + 100, y + (i * lineheight));
      }
      y += lines.length * lineheight;
      y += space;
    }
  })

  // const dataURL = canvas.toDataURL();
  const imgBuffer = canvas.toBuffer('image/jpeg');

  const id = crypto.randomUUID();
  const imagePath = `./sequences/${id}.jpeg`;

  fs.writeFileSync(imagePath, imgBuffer);

  const data = fs.readFileSync(imagePath);

  const res = await imagekit.upload({
    file: data,
    fileName: `${id}.jpeg`
  });

  console.log(res);
  return res.url;
}




const token = '5748686674:AAFU8Uz3qCpRyuGfNxyrCe3X-8kKjEqXcoU';
const bot = new TelegramBot(token, {polling: true});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    'Хочешь новую последовательность? Жми кнопку!',
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Получить последовательность',
              callback_data: 'getSequence'
            }
          ]
        ]
      }
    }
  )
});

bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;

  if (query.data === 'getSequence') {
    (async () => {
      try {
        const image = await generateSequence();
        bot.sendPhoto(
          chatId,
          image,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: 'Получить последовательность',
                    callback_data: 'getSequence'
                  }
                ]
              ]
            }
          }
        );
      } catch (error) {
        console.log(error);
      }
    })();
  }
});
