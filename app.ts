'use strict';

import Homey from 'homey';
import axios from 'axios';
import * as cheerio from 'cheerio';

class MyApp extends Homey.App {

  youCanWearShortsTodayCard: Homey.FlowCardCondition|undefined;

  async onInit() {
    const myImage = await this.homey.images.createImage();

    const temperatureToken = await this.homey.flow.createToken('kortebroek_temperature', {
      value: undefined,
      type: 'number',
      title: 'Kortebroek Temperature',
    });

    const regenkansToken = await this.homey.flow.createToken('kortebroek_regenkans', {
      value: undefined,
      type: 'number',
      title: 'Kortebroek Regenkans',
    });

    const imageToken = await this.homey.flow.createToken('kortebroek_image', {
      value: undefined,
      type: 'image',
      title: 'Kortebroek Image',
    });

    await imageToken.setValue(myImage);

    this.youCanWearShortsTodayCard = this.homey.flow.getConditionCard('you-can-wear-shorts-today');
    this.youCanWearShortsTodayCard.registerRunListener(async (args, state) => {
      const data = await this.scrapeData.bind(this)();

      await temperatureToken.setValue(Number(data[1]!.match(/\d+/)![0]));
      await regenkansToken.setValue(Number(data[2]!.match(/\d+/)![0]));

      const yes = data[0]!.includes('ja');

      if (yes) {
        myImage.setUrl('https://www.kanikeenkortebroekaan.nl/assets/yes-man.png');
      } else {
        myImage.setUrl('https://www.kanikeenkortebroekaan.nl/assets/no-man.png');
      }

      await imageToken.setValue(myImage);

      return yes;
    });
  }

  async scrapeData() {
    try {
      const response = await axios.get('https://www.kanikeenkortebroekaan.nl');
      const html = response.data;

      const $ = cheerio.load(html);

      const data = [];

      data.push($('.main-image > img').first().attr('alt'));
      data.push($('.temp .data:nth-child(1)').first().text());
      data.push($('.temp .data:nth-child(2)').first().text());

      return data;
    } catch (error) {
      this.log(error);
      return [];
    }
  }

}

module.exports = MyApp;
