import { http, HttpResponse, type RequestHandler } from 'msw';

/**
 * API fixtures for the visual baselines, as MSW handlers (the idiom the vitest
 * route tests use). Anything not handled here gets `{}`, so most pages show
 * their empty state; the routes below get data so their cards and rows are
 * covered too. Keep image urls null: off-origin images are aborted anyway.
 */

const PROFILE = { id: 1, name: 'Admin', is_admin: true };

/** Every page needs these to get past the profile picker and setup wizard. */
export const shellHandlers: RequestHandler[] = [
  http.get('*/api/profiles/current', () => HttpResponse.json({ success: true, profile: PROFILE })),
  http.get('*/api/profiles', () => HttpResponse.json({ success: true, profiles: [PROFILE] })),
  http.get('*/api/setup/status', () => HttpResponse.json({ setup_complete: true })),
];

const ARTIST_NAMES = [
  'Aphex Twin',
  'Boards of Canada',
  'Burial',
  'Caribou',
  'Four Tet',
  'Jon Hopkins',
  'Massive Attack',
  'Portishead',
  'Radiohead',
  'Röyksopp',
  'Squarepusher',
  'Thom Yorke',
];

const libraryArtists = http.get('*/api/library/artists', () =>
  HttpResponse.json({
    success: true,
    artists: ARTIST_NAMES.map((name, i) => ({
      id: i + 1,
      name,
      image_url: null,
      track_count: 10 + i * 7,
      is_watched: i % 3 === 0,
      upgradable_count: i % 4 === 0 ? 2 : 0,
      spotify_artist_id: i % 2 ? `sp${i}` : null,
      musicbrainz_id: `mb${i}`,
      deezer_id: i % 3 ? i : null,
    })),
    pagination: {
      page: 1,
      limit: 75,
      total_count: ARTIST_NAMES.length,
      total_pages: 1,
      has_prev: false,
      has_next: false,
    },
    upgradable_total: 6,
  }),
);

const watchlistArtists = [
  http.get('*/api/watchlist/count', () => HttpResponse.json({ success: true, count: 6 })),
  http.get('*/api/watchlist/artists', () =>
    HttpResponse.json({
      success: true,
      artists: ARTIST_NAMES.slice(0, 6).map((artist_name, i) => ({
        id: i + 1,
        artist_name,
        date_added: '2025-01-01 10:00:00',
        last_scan_timestamp: i % 2 ? '2025-01-14 10:00:00' : null,
        created_at: '2025-01-01 10:00:00',
        updated_at: '2025-01-01 10:00:00',
        image_url: null,
        spotify_artist_id: `sp${i}`,
        itunes_artist_id: null,
        deezer_artist_id: i % 2 ? `dz${i}` : null,
        discogs_artist_id: null,
        musicbrainz_artist_id: `mb${i}`,
        amazon_artist_id: null,
      })),
    }),
  ),
];

const issues = [
  http.get('*/api/issues/counts', () =>
    HttpResponse.json({
      success: true,
      counts: { open: 2, in_progress: 1, resolved: 0, dismissed: 0, total: 3 },
    }),
  ),
  http.get('*/api/issues', () =>
    HttpResponse.json({
      success: true,
      total: 2,
      issues: [
        {
          id: 7,
          profile_id: 1,
          entity_type: 'album',
          entity_id: '15',
          category: 'wrong_metadata',
          title: 'Bad tags',
          description: 'Album title is wrong',
          status: 'open',
          priority: 'normal',
          snapshot_data: { title: 'Album Name', artist_name: 'Artist', format: 'FLAC' },
          created_at: '2025-01-10 10:30:00',
          reporter_name: 'Ada',
        },
        {
          id: 8,
          profile_id: 1,
          entity_type: 'track',
          entity_id: '99',
          category: 'audio_quality',
          title: 'Clipping in the chorus',
          description: 'Audible distortion around 1:20',
          status: 'in_progress',
          priority: 'high',
          snapshot_data: { title: 'Track Name', artist_name: 'Artist', format: 'MP3' },
          created_at: '2025-01-12 08:00:00',
          reporter_name: 'Admin',
        },
      ],
    }),
  ),
];

const stats = [
  http.get('*/api/stats/cached', () =>
    HttpResponse.json({
      success: true,
      overview: {
        total_plays: 24,
        total_time_ms: 6_600_000,
        unique_artists: 3,
        unique_albums: 4,
        unique_tracks: 12,
      },
      previous: {
        total_plays: 12,
        total_time_ms: 3_300_000,
        unique_artists: 3,
        unique_albums: 2,
        unique_tracks: 6,
      },
      clock: {
        grid: Array.from({ length: 7 }, (_, d) =>
          Array.from({ length: 24 }, (_, h) => (d === 3 && h === 21 ? 9 : (d + h) % 5)),
        ),
        peak: { weekday: 3, hour: 21, plays: 9 },
        total: 9,
      },
      rhythm: {
        current_streak: 4,
        longest_streak: 11,
        busiest_day: { date: '2025-01-12', plays: 9 },
        active_days: 20,
      },
      own_vs_play: [
        { genre: 'Metal', owned_pct: 80, played_pct: 0, gap: -80, owned_tracks: 8, plays: 0 },
        { genre: 'Pop', owned_pct: 20, played_pct: 100, gap: 80, owned_tracks: 2, plays: 4 },
      ],
      neglected: [{ id: 1, name: 'Dusty Record', artist: 'Someone', tracks: 11 }],
      top_artists: [
        { id: 7, name: 'Artist A', play_count: 10 },
        { id: 8, name: 'Artist B', play_count: 6 },
      ],
      top_albums: [],
      top_tracks: [],
      timeline: [
        { date: 'Jan 10', plays: 4 },
        { date: 'Jan 11', plays: 8 },
        { date: 'Jan 12', plays: 12 },
      ],
      genres: [
        { genre: 'House', play_count: 10, percentage: 60 },
        { genre: 'Ambient', play_count: 6, percentage: 40 },
      ],
      recent: [{ title: 'Track A', artist: 'Artist A', played_at: '2025-01-14T08:00:00Z' }],
      health: { total_tracks: 12, format_breakdown: { FLAC: 10, MP3: 2 } },
    }),
  ),
  http.get('*/api/listening-stats/status', () =>
    HttpResponse.json({ stats: { last_poll: '2025-01-14 10:00:00' } }),
  ),
  http.get('*/status', () =>
    HttpResponse.json({ media_server: { type: 'plex', connected: true } }),
  ),
];

const artistDetail = [
  http.get('*/api/artist-detail/:id', () =>
    HttpResponse.json({
      success: true,
      artist: { id: 42, name: 'Aphex Twin', server_source: 'plex' },
      discography: {
        albums: [
          { id: 1, title: 'Selected Ambient Works 85-92', owned: true, image_url: null },
          { id: 2, title: 'Richard D. James Album', owned: true, image_url: null },
          { id: 3, title: 'Drukqs', owned: false, image_url: null },
          { id: 4, title: 'Syro', owned: false, image_url: null },
        ],
        source: 'spotify',
      },
    }),
  ),
];

/** Handlers per route, on top of `shellHandlers`. */
export const routeHandlers: Record<string, RequestHandler[]> = {
  library: [libraryArtists],
  watchlist: watchlistArtists,
  issues,
  stats,
  'artist-detail': artistDetail,
};
