/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from 'dotenv';
import { floor, random } from 'lodash';
import axios from 'axios';
import { faker } from '@faker-js/faker';




dotenv.config({});

function avatarColor() {
  const colors = [
    '#E57373',
    '#F06292',
    '#BA68C8',
    '#9575CD',
    '#7986CB',
    '#64B5F6',
    '#4FC3F7',
    '#4DD0E1',
    '#4DB6AC',
    '#81C784',
    '#aed581',
    '#dce775',
    '#ffd54f',
    '#e57373',
    '#f06292',
    '#ba68c8',
    '#9575cd',
    '#7986cb',
    '#64b5f6',
    '#4fc3f7',
    '#4dd0e1',
    '#4db6ac',
    '#81c784',
    '#aed581',
    '#dce775',
    '#ffd54f',
    '#e57373',
    '#f06292',
    '#ba68c8',
    '#9575cd',
    '#7986cb',
    '#64b5f6',
    '#4fc3f7',
    '#4dd0e1',
    '#4db6ac',
    '#81c784',
    '#aed581',
    '#dce775',
    '#ffd54f'
  ];
  return colors[floor(random(0.9) * colors.length)];
}

// function generateAvatar(text: string, backgroundColor: string, foregroundColor = 'white') {
//   const canvas = createCanvas(200, 200);
//   const context = canvas.getContext('2d');

//   context.fillStyle = backgroundColor;
//   context.fillRect(0, 0, canvas.width, canvas.height);

//   context.font = 'normal 80px sans-serif';
//   context.fillStyle = foregroundColor;
//   context.textAlign = 'center';
//   context.textBaseline = 'middle';
//   context.fillText(text, canvas.width / 2, canvas.height / 2);

//   return canvas.toDataURL('image/png');
// }


// This is just an example to seed user data. same way you can add post data or any other data in the seed.ts file
async function seedUserData(count: number): Promise<void> {
  let i = 0;
  try {
    for (i = 0; i < count; i++) {
      const username: string = faker.word.adjective();
      const color = avatarColor();
      // const avatar = generateAvatar(username.charAt(0).toUpperCase(), color);
      const avatar = 'https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_960_720.png';

      const body = {
        username,
        email: faker.internet.email(),
        password: 'qwerty',
        avatarColor: color,
        avatarImage: avatar
      };
      console.log(`***ADDING USER TO DATABASE*** - ${i + 1} of ${count} - ${username}`);
      await axios.post(`${process.env.API_URL}/auth/signup`, body);
    }
  } catch (error: any) {
    console.log(error?.response?.data);
  }
}

seedUserData(10);
