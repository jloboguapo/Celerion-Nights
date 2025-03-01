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

const CallFortrea = async () => {
  const response = await fetch(
    'https://www.fortreaclinicaltrials.com/en-us/clinical-research/browse-studies?field_location_target_id=All&field_gender_target_id=10&field_age_target_id=18'
  );
  const data = await response.text();
  const dom = new JSDOM(data);

  const hreflang = () =>
    Array.from(dom.window.document.querySelectorAll('.views-field > a'))
      .map(name => name.innerHTML)
      .slice(6);

  const getStudies = () =>
    Array.from(dom.window.document.querySelectorAll('.views-field'))
      .map(name => name.innerHTML)
      .slice(6);

  const slicedStudies = arr => {
    const slicedArrays = [];
    for (let i = 0; i < arr.length; i += 6) {
      const chunk = arr.slice(i, i + 6);
      slicedArrays.push(chunk);
    }
    return slicedArrays;
  };

  const noHreflang = slicedStudies(getStudies())
    .filter(
      innerArray => !innerArray.toString().toLowerCase().includes('overweight')
    )
    .map(innerArray =>
      innerArray.filter(
        name => !name.toString().toLowerCase().includes('hreflang')
      )
    );

  const filteredStudies = (sourceArray, targetArrays) => {
    for (let i = 0; i < sourceArray.length; i++) {
      if (targetArrays[i] && Array.isArray(targetArrays[i])) {
        targetArrays[i].unshift(sourceArray[i]);
      }
    }

    return targetArrays
      .map(innerArr =>
        innerArr.map(name => name.replaceAll('amp;', '')).join('\n')
      )
      .join('\n\n\n');
  };

  const msgText = filteredStudies(hreflang(), noHreflang);

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

CallFortrea();
