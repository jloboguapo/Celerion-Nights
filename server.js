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

  const getHreflang = () =>
    Array.from(dom.window.document.querySelectorAll('.views-field > a'))
      .map(name => name.innerHTML)
      .slice(6);

  const hreflang = getHreflang();

  const getStudies = () =>
    Array.from(dom.window.document.querySelectorAll('.views-field'))
      .map(name => name.innerHTML)
      .slice(6);

  const preSlicedStudies = getStudies();

  const slicedStudies = arr => {
    const slicedArrays = [];
    arr.map(
      (_, index) =>
        (index % 6 === 0 || index === 0) &&
        slicedArrays.push(arr.slice(index, index + 6))
    );

    return slicedArrays;
  };

  const noHreflang = slicedStudies(preSlicedStudies)
    .filter(
      innerArray => !innerArray.toString().toLowerCase().includes('overweight')
    )
    .map(innerArray =>
      innerArray.filter(
        name => !name.toString().toLowerCase().includes('hreflang')
      )
    );

  const sortDollarAmountsDescending = arr => {
    arr.sort((a, b) => {
      const amountA = parseFloat(a.at(-1).replace(/[^0-9.-]+/g, ''));
      const amountB = parseFloat(b.at(-1).replace(/[^0-9.-]+/g, ''));
      return amountB - amountA;
    });
    return arr;
  };

  const filteredStudies = (sourceArray, targetArrays) => {
    sourceArray.map((_, index) =>
      targetArrays[index].unshift(sourceArray[index])
    );

    return sortDollarAmountsDescending(targetArrays)
      .map(innerArr =>
        innerArr.map(name => name.replaceAll('amp;', '')).join('\n')
      )
      .join('\n\n\n');
  };

  const msgText = filteredStudies(hreflang, noHreflang);

  const msg = {
    from: email,
    to: email,
    subject: 'Fortrea Studies',
    text: msgText,
  };
  msgText.length && mg.messages.create(process.env.DOMAIN, msg);
};

const job = schedule.scheduleJob('0 */4 * * *', () => {
  CallFortrea();
});

CallFortrea();
