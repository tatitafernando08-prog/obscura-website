export interface JourneyMilestone {
  date: string;
  title: string;
  description: string;
  images: { src: string; alt: string }[];
}

export const JOURNEY_MILESTONES: JourneyMilestone[] = [
  {
    date: 'Milestone 1',
    title: 'The idea',
    description: 'It started with a simple frustration, past papers scattered everywhere and no easy way to get help at 11pm before an exam. We sketched out what became Obscura on a whiteboard.',
    images: [
      { src: '/assets/journey/milestone-1-whiteboard.jpg', alt: 'Our original whiteboard sketch' },
      { src: '/assets/journey/milestone-1.jpg', alt: 'The Obscura team' },
    ],
  },
  {
    date: 'Milestone 2',
    title: 'First wireframes',
    description: 'Before writing a line of code, we mapped out every screen, chat, past papers, planner, timer, to make sure the whole experience actually made sense together.',
    images: [{ src: '/assets/journey/milestone-2.jpg', alt: 'Wireframes and planning' }],
  },
  {
    date: 'Milestone 3',
    title: "Building NESH's brain",
    description: 'We built the backend that lets NESH search real past papers and answer in context, RAG search, a FastAPI backend, and a lot of trial and error getting the answers to feel genuinely helpful.',
    images: [{ src: '/assets/journey/milestone-3.jpg', alt: 'Backend development' }],
  },
  {
    date: 'Milestone 4',
    title: 'Working sessions',
    description: 'Countless hours together figuring things out, one focused session at a time.',
    images: [
      { src: '/assets/journey/milestone-library-1.jpg', alt: 'Team working at the library' },
      { src: '/assets/journey/milestone-library-2.jpg', alt: 'Team working at the library' },
      { src: '/assets/journey/milestone-library-3.jpg', alt: 'Team working at the library' },
    ],
  },
  {
    date: 'Milestone 5',
    title: 'Writing the code',
    description: 'Line by line, things came together, plenty of debugging, plenty of "wait, why isn\'t this working" moments along the way.',
    images: [
      { src: '/assets/journey/milestone-code-1.jpg', alt: 'Writing the website code' },
      { src: '/assets/journey/milestone-code-2.jpg', alt: 'Writing the website code' },
      { src: '/assets/journey/milestone-code-3.jpg', alt: 'Writing the website code' },
    ],
  },
  {
    date: 'Milestone 6',
    title: 'Working together',
    description: 'Some of our best problem-solving happened side by side, laptops open, ideas flowing.',
    images: [
      { src: '/assets/journey/milestone-cafe-1.jpg', alt: 'Working at the cafe' },
      { src: '/assets/journey/milestone-cafe-2 (1).jpg', alt: 'Working at the cafe' },
      { src: '/assets/journey/milestone-cafe-3 (1).jpg', alt: 'Working at the cafe' },
    ],
  },
  {
    date: 'Milestone 7',
    title: '3D printing the shell',
    description: 'We designed and 3D printed our own enclosure for the NESH robot, ears, speaker grille, and a cutout for the screen, all from scratch and iterated by hand.',
    images: [{ src: '/assets/journey/milestone-3d-print.jpg', alt: '3D printed NESH robot shell prototype' }],
  },
  {
    date: 'Milestone 8',
    title: 'Getting the screen working',
    description: "The first big win on hardware, NESH's display actually running and responding, the moment this stopped being just a website and started being a real device.",
    images: [{ src: '/assets/journey/milestone-screen-demo.jpg', alt: 'NESH robot screen demo running' }],
  },
  {
    date: 'Milestone 9',
    title: 'Bringing it all together',
    description: 'Piecing together the website, the chat interface, the Pomodoro planner, and the sign-up flow into one cohesive product, this is where it started feeling real.',
    images: [{ src: '/assets/journey/milestone-5.jpg', alt: 'Full app coming together' }],
  },
  {
    date: 'Milestone 10',
    title: 'Spreading the word',
    description: 'Getting Obscura in front of people meant more than just code, we filmed our own ad, behind the scenes and all, to actually tell people this exists.',
    images: [{ src: '/assets/journey/milestone-7.jpg', alt: 'Filming the Obscura ad' }],
  },
  {
    date: 'Milestone 11',
    title: 'Small wins along the way',
    description: 'Every working feature felt like a reason to celebrate, this project has been as much about the people as the product.',
    images: [
      { src: '/assets/journey/milestone-wins-1 (1).jpg', alt: 'Team celebrating progress' },
      { src: '/assets/journey/milestone-wins-2.jpg', alt: 'Team celebrating progress' },
    ],
  },
  {
    date: 'Where we are now',
    title: 'Obscura today',
    description: 'Still building, still improving, and still just a group of students trying to make studying a little less stressful for everyone else. Thanks for following along.',
    images: [{ src: '/assets/journey/milestone-6.jpg', alt: 'Current state of Obscura' }],
  },
];
