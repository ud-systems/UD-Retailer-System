
export const getTimeBasedGreeting = (userName: string): string => {
  const hour = new Date().getHours();
  const firstName = userName.split(' ')[0]; // Get first name
  
  if (hour < 12) {
    return `Good Morning, ${firstName}`;
  } else if (hour < 18) {
    return `Good Afternoon, ${firstName}`;
  } else {
    return `Good Evening, ${firstName}`;
  }
};

export const getWelcomeMessage = (userName: string): string => {
  const greetings = [
    `Welcome back, ${userName}!`,
    `Great to see you again, ${userName}!`,
    `Hello ${userName}, ready to get started?`
  ];
  
  return greetings[Math.floor(Math.random() * greetings.length)];
};
