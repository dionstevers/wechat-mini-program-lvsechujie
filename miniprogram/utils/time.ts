



function getWeekRange() {
  const currentDate = new Date();
  const first = currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -6 : 1);
  const last = first + 6;

  const firstDayOfWeek = new Date(currentDate.setDate(first)).setHours(0, 0, 0, 0);
  const lastDayOfWeek = new Date(currentDate.setDate(last)).setHours(23, 59, 59, 999);
  return { firstDayOfWeek, lastDayOfWeek };
}

function formatTime(time: number) {
  const date = new Date(time);
  const year = date.getFullYear();
  const month = padZero(date.getMonth() + 1);
  const day = padZero(date.getDate());
  const hour = padZero(date.getHours());
  const minute = padZero(date.getMinutes());
  const formattedTime = `${year}-${month}-${day} ${hour}:${minute}`;
  return formattedTime;
}

function padZero(num: number) {
  return num < 10 ? '0' + num : num;
}

export { getWeekRange, formatTime }