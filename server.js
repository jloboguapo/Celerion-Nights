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

const callCelerion = async () => {
  const response = await fetch(
    'https://helpresearch.com/studies?field_csapi_gender_value=2&field_csapi_smoking_value=All&city=All&age=&maxbmi=All&minbmi=All&field_bmi_weight=&field_bmi_height='
  );
  const data = await response.text();
  const dom = new JSDOM(data);

  const getStudies = () =>
    Array.from(dom.window.document.querySelectorAll('.field-content'))
      .filter(name => !name.innerHTML.includes('<span'))
      .map(name => name.innerHTML);

  const slicedStudies = arr => {
    const slicedArrays = [];
    for (let i = 0; i < arr.length; i += 8) {
      const chunk = arr.slice(i, i + 8);
      slicedArrays.push(chunk);
    }
    return slicedArrays;
  };

  const msgText = slicedStudies(getStudies())
    .filter(
      innerArray => !innerArray.toString().toLowerCase().includes('overweight')
    )
    .filter(innerArray => innerArray.toString().toLowerCase().includes('-ban'))
    .map(innerArray =>
      innerArray
        .filter(item => item !== '<i class="fas fa-smoking-ban"></i>')
        .map(name => name.replaceAll('amp;', ''))
        .join('\n')
    )
    .join('\n\n\n');

  const msg = {
    from: email,
    to: email,
    subject: 'Available Studies',
    text: msgText,
  };
  msgText.length && mg.messages.create(process.env.DOMAIN, msg);
};

// const job = schedule.scheduleJob('0 */2 * * *', () => {
// });

callCelerion();
