/** Verified remote images for mock content previews. */

const unsplash = (photoId: string, w = 640, h = 360) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

const tmdb = (posterPath: string, size: 'w342' | 'w500' | 'w780' = 'w500') =>
  `https://image.tmdb.org/t/p/${size}/${posterPath}`;

export const MOCK_IMAGES = {
  sports: [
    unsplash('photo-1461896836934-ffe607ba8211'),
    unsplash('photo-1571019614242-c5c5dee9f50b'),
    unsplash('photo-1579952363873-27f3bade9f55'),
    unsplash('photo-1552674605-db6ffd4facb5'),
  ],
  cooking: [
    unsplash('photo-1556910103-1c02745aae4d'),
    unsplash('photo-1504674900247-0877df9cc836'),
    unsplash('photo-1498837167922-ddd27525d352'),
    unsplash('photo-1546069901-ba9599a7e63c'),
  ],
  education: [
    unsplash('photo-1434030216411-0b793f4b4173'),
    unsplash('photo-1503676260728-1c00da094a0b'),
    unsplash('photo-1509062522246-3755977927d7'),
    unsplash('photo-1434030216411-0b793f4b4173'),
  ],
  crypto: [
    unsplash('photo-1639762681485-074b7f938ba0'),
    unsplash('photo-1639762681485-074b7f938ba0'),
    unsplash('photo-1639762681485-074b7f938ba0'),
    unsplash('photo-1639762681485-074b7f938ba0'),
  ],
  finance: [
    unsplash('photo-1611974789855-9c2a0a7236a3'),
    unsplash('photo-1554224155-6726b3ff858f'),
    unsplash('photo-1579621970795-87facc2f976d'),
    unsplash('photo-1460925895917-afdab827c52f'),
  ],
  fitness: [
    unsplash('photo-1517836357463-d25dfeac3438'),
    unsplash('photo-1534438327276-14e5300c3a48'),
    unsplash('photo-1571019613454-1cb2f99b2d8b'),
    unsplash('photo-1518611012118-696072aa579a'),
  ],
  tech: [
    unsplash('photo-1518770660439-4636190af475'),
    unsplash('photo-1485827404703-89b55fcc595e'),
    unsplash('photo-1516321318423-f06f85e504b3'),
    unsplash('photo-1550751827-4bd374c3f58b'),
  ],
  /** Crime, drama, police, acting - vertical series posters */
  vertical: [
    unsplash('photo-1451187580459-43490279c0fa', 400, 600),
    unsplash('photo-1574267432553-4b4628081c31', 400, 600),
    unsplash('photo-1589391886645-d51941baf7fb', 400, 600),
    unsplash('photo-1450101499163-c8848c66ca85', 400, 600),
    unsplash('photo-1551836022-d5d88e9218df', 400, 600),
    unsplash('photo-1485846234645-a62644f84728', 400, 600),
    unsplash('photo-1478720568477-152d9b164e26', 400, 600),
    unsplash('photo-1560253023-3ec5d502959f', 400, 600),
  ],
  podcast: [
    unsplash('photo-1478737270239-2f02b77fc618', 400, 400),
    unsplash('photo-1590602847861-f357a9332bbc', 400, 400),
    unsplash('photo-1478737270239-2f02b77fc618', 400, 400),
    unsplash('photo-1507003211169-0a1dd7228f2d', 400, 400),
  ],
  avatar: [
    unsplash('photo-1507003211169-0a1dd7228f2d', 200, 200),
    unsplash('photo-1494790108377-be9c29b29330', 200, 200),
    unsplash('photo-1500648767791-00dcc994a43e', 200, 200),
  ],
  banner: unsplash('photo-1557683316-973673baf926', 1200, 400),
} as const;

/** Famous movie posters (TMDB CDN, verified). */
export const MOVIE_POSTERS = [
  { title: 'Titanic', year: 1997, path: 'daFTyT80pJGvhItGkC5p8K0XvzC.jpg', genre: 'drama' },
  { title: 'Pirates of the Caribbean', year: 2003, path: '7BtkX2L1enXtyW8nLwkBjeoJTqV.jpg', genre: 'action' },
  { title: 'Tomb Raider', year: 2001, path: 'uX9gmW5eajqIAOAGr1ozuWPsnzE.jpg', genre: 'action' },
  { title: 'Maleficent', year: 2014, path: 's00QPiqIkUMv0uETiXF7xl7ocrG.jpg', genre: 'fantasy' },
  { title: 'Mr. & Mrs. Smith', year: 2005, path: 'kjD700RtyhveN3ZbOnSvUSne0Qj.jpg', genre: 'action' },
  { title: 'The Transporter', year: 2002, path: 'dncJ81z1BahrT3ogLvlxOUC5n4u.jpg', genre: 'action' },
  { title: 'The Italian Job', year: 2003, path: 'eSkjK4kctyrWpFhxl35GPvSs6tI.jpg', genre: 'action' },
  { title: 'Salt', year: 2010, path: 'ppXyhOe8UCEOrBRSYqE3SkHwrcR.jpg', genre: 'action' },
  { title: 'Fast Five', year: 2011, path: '3qrKhGez6rmt9sZgiWk84erhQg2.jpg', genre: 'action' },
  { title: 'Wanted', year: 2008, path: 'njy7Pz7ZHZceO7lNfGIHKphY8Hd.jpg', genre: 'action' },
  { title: 'The Dark Knight', year: 2008, path: 'x9I3i2j3WuGR83liutH6ibYhEul.jpg', genre: 'action' },
  { title: 'Inception', year: 2010, path: 'gljq6rY3g9jOUGOWP5TPQJvryhX.jpg', genre: 'sci-fi' },
  { title: 'Avatar', year: 2009, path: 'sX50MuB7eXi5fAGJVeJS9jpYBNF.jpg', genre: 'sci-fi' },
  { title: 'Gladiator', year: 2000, path: 'lgi4I9kJXue1vxEUKqxQTUODDVu.jpg', genre: 'action' },
  { title: 'The Matrix', year: 1999, path: 'dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg', genre: 'sci-fi' },
  { title: 'Jurassic Park', year: 1993, path: 'e0tH8MTDA7FzgHqRuAInKB4Ghgh.jpg', genre: 'adventure' },
  { title: 'The Expendables 3', year: 2014, path: '9JNMhcIgtSRbDfo9A6EgXH3j2Ds.jpg', genre: 'action' },
  { title: 'John Wick', year: 2014, path: 'pqi2GrNfwjtqcNqHhD4WzhHbbxk.jpg', genre: 'action' },
  { title: 'Taken', year: 2008, path: '5atdxD1wLPf15Uh9CNyRO0ZVVIM.jpg', genre: 'action' },
  { title: 'Mad Max: Fury Road', year: 2015, path: 'hA2ple9q4qnwxp3hKVNhroipsir.jpg', genre: 'action' },
  { title: 'Fight Club', year: 1999, path: 'jSziioSwPVrOy9Yow3XhWIBDjq1.jpg', genre: 'drama' },
  { title: 'Pulp Fiction', year: 1994, path: 'vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg', genre: 'crime' },
] as const;

type Topic = keyof typeof MOCK_IMAGES;

export function mockThumb(topic: Topic, index: number, w = 640, h = 360): string {
  const pool = MOCK_IMAGES[topic];
  const id = Array.isArray(pool) ? pool[index % pool.length] : pool;
  if (typeof id === 'string' && id.includes('unsplash.com')) {
    return id.replace(/w=\d+&h=\d+/, `w=${w}&h=${h}`);
  }
  return id as string;
}

export function mockVerticalPoster(index: number, w = 400, h = 600): string {
  return mockThumb('vertical', index, w, h);
}

export function mockMoviePoster(index: number): string {
  const movie = MOVIE_POSTERS[index % MOVIE_POSTERS.length];
  return tmdb(movie.path);
}

export function getMoviePosterMeta(index: number) {
  return MOVIE_POSTERS[index % MOVIE_POSTERS.length];
}

/** @deprecated Use mockMoviePoster or mockVerticalPoster */
export function mockPoster(index: number): string {
  return mockVerticalPoster(index);
}
