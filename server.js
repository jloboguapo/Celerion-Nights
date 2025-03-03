import dotenv from 'dotenv';
import jsdom from 'jsdom';
import Mailgun from 'mailgun.js';
import fetch from 'node-fetch';
import schedule from 'node-schedule';

dotenv.config();
const { JSDOM } = jsdom;
const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.API_KEY,
});
const email = process.env.EMAIL;

const callDrVince = async () => {
  const response = await fetch('https://drvince.com/participate-in-a-study/');
  const data = await response.text();
  const dom = new JSDOM(data);

  const getStudies = () =>
    Array.from(
      dom.window.document.querySelectorAll('div.grid-posts > div')
    ).map(name =>
      name.textContent
        .replaceAll('\t', '')
        .replaceAll('\n', '')
        .replaceAll('  ', '')
    );

  const studies = getStudies();

  const sortDollarAmountsDescending = arr => {
    arr.sort((a, b) => {
      const amountA = parseFloat(
        a.match(/\$(\d+,\d{3})*/)?.[1].replace(',', '') || 0
      );
      const amountB = parseFloat(
        b.match(/\$(\d+,\d{3})*/)?.[1].replace(',', '') || 0
      );
      return amountB - amountA;
    });
    return arr;
  };

  const sortedStudies = sortDollarAmountsDescending(studies.slice());

  const msgText = sortedStudies.join('\n\n\n');

  const msg = {
    from: email,
    to: email,
    subject: 'Dr Vince Studies',
    text: msgText,
  };
  msgText.length && mg.messages.create(process.env.DOMAIN, msg);
};

const job = schedule.scheduleJob('0 */4 * * *', () => {
  callDrVince();
});

callDrVince();
