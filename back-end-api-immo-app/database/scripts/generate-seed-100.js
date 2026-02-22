#!/usr/bin/env node
/**
 * Génère le SQL pour ~100 biens (90 en plus du seed-dev.sql de base).
 * Usage: node database/scripts/generate-seed-100.js > database/seed-dev-100.sql
 * Puis: psql -U root -d back_end_api_immo_app -f database/seed-dev-100.sql
 *
 * À exécuter après seed-dev.sql pour avoir 100 biens au total.
 */

const fs = require('fs');
const path = require('path');

const CITIES = [
  { city: 'Cotonou', districts: ['Fidjrossè', 'Akpakpa', 'Ganhi', 'Cadjehoun', 'Godomey', 'Akossombo', 'Cotonou 2', 'Saint-Michel'], lat: 6.36, lng: 2.43 },
  { city: 'Abomey-Calavi', districts: ['Calavi', 'Godomey', 'Kpota', 'Zogbadjè', 'Togba', 'Hêvié'], lat: 6.42, lng: 2.34 },
  { city: 'Porto-Novo', districts: ['Ouando', 'Adjarra', 'Akron', 'Agbokou'], lat: 6.50, lng: 2.62 },
  { city: 'Sèmè-Kpodji', districts: ['Sèmè', 'Kpodji', 'Agué'], lat: 6.40, lng: 2.65 },
  { city: 'Parakou', districts: ['Centre', 'Borgou'], lat: 9.34, lng: 2.63 },
  { city: 'Natitingou', districts: ['Centre', 'Atacora'], lat: 10.30, lng: 1.38 },
];

const TITLES = [
  'Studio meublé',
  'Chambre à louer',
  'Appartement F2',
  'Appartement F3',
  'Maison 2 chambres',
  'Maison 3 chambres',
  'Duplex standing',
  'Chambre étudiante',
  'Studio proche université',
  'Appartement vue mer',
  'Maison cour commune',
  'Chambre économique',
  'Studio centre-ville',
  'Appartement résidence sécurisée',
  'Maison familiale',
];

const DESCRIPTIONS = [
  'Calme, proche commerces et transports.',
  'Idéal étudiant ou jeune actif.',
  'Quartier résidentiel, route carrossable.',
  'Proche marché et taxis.',
  'Eau et électricité incluses.',
  'Gardiennage 24h/24.',
  'Proche plage et administrations.',
  'Grande cour, idéal famille.',
];

function uuid(base, n) {
  const s = String(n).padStart(12, '0');
  return `${base}-0000-0000-0000-${s}`;
}

function esc(s) {
  return (s || '').replace(/'/g, "''");
}

const OUT = path.join(__dirname, '..', 'seed-dev-100.sql');
const lines = [];

lines.push('-- =====================================================================');
lines.push('-- Extension seed : 90 biens supplémentaires (total ~100 après seed-dev.sql)');
lines.push('-- Généré par: node database/scripts/generate-seed-100.js');
lines.push('-- =====================================================================');
lines.push('');

const landlord = ['00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003'];
const agents = ['00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005'];

const propValues = [];
const mediaValues = [];
const roomValues = [];
let roomId = 16; // après les 15 du seed-dev

for (let i = 11; i <= 100; i++) {
  const propId = uuid('30000000', i);
  const cityData = CITIES[i % CITIES.length];
  const district = cityData.districts[i % cityData.districts.length];
  const title = TITLES[i % TITLES.length] + ' ' + cityData.districts[0];
  const desc = DESCRIPTIONS[i % DESCRIPTIONS.length];
  const price = [20000, 35000, 50000, 75000, 90000, 120000, 180000, 250000][i % 8];
  const lat = (cityData.lat + (i % 100) / 10000).toFixed(7);
  const lng = (cityData.lng + (i % 100) / 10000).toFixed(7);
  const status = i % 10 === 0 ? 'coming_soon' : 'available';
  const availableDate = status === 'coming_soon' ? "NOW() + INTERVAL '15 days'" : 'NULL';
  const landlord = landlord[i % 2];
  const agent = agents[i % 2];
  const titleJson = JSON.stringify({ fr: title });
  const descJson = JSON.stringify({ fr: desc });
  const daysAgo = 5 + (i % 60);

  propValues.push(
    `('${propId}', '${landlord}', '${agent}', '${esc(title)}', '${esc(titleJson)}', '${esc(descJson)}', '${price}.00', '${esc(cityData.city)}', '${esc(district)}', 'Adresse type ${i}.', ${lat}, ${lng}, '${status}', ${availableDate}, NOW() - INTERVAL '${daysAgo} days', NOW() - INTERVAL '1 day')`
  );

  mediaValues.push(
    `('${uuid('40000000', i)}', '${propId}', 'https://picsum.photos/seed/immo${i}/800/600', 'image')`
  );

  const numRooms = 1 + (i % 3);
  for (let r = 0; r < numRooms; r++) {
    const rName = r === 0 ? 'Chambre principale' : (r === 1 ? 'Chambre secondaire' : 'Chambre 3');
    const rPrice = r === 0 ? price : Math.round(price * (0.4 + r * 0.2));
    const rSurface = 10 + (i + r) % 15;
    const rFloor = (i + r) % 4;
    const roomDesc = JSON.stringify({ fr: desc });
    roomValues.push(
      `('${uuid('50000000', roomId)}', '${propId}', '${esc(rName)}', 'chambre', '${rPrice}.00', ${rSurface}, ${rFloor}, true, '${esc(roomDesc)}')`
    );
    roomId++;
  }
}

lines.push('INSERT INTO properties (id, landlord_id, agent_id, title, title_translations, description_translations, price_monthly, city, district, address_details, latitude, longitude, status, available_date, created_at, updated_at)');
lines.push('VALUES');
lines.push(propValues.join(',\n'));
lines.push('ON CONFLICT (id) DO NOTHING;');
lines.push('');

lines.push('INSERT INTO media (id, property_id, url, type)');
lines.push('VALUES');
lines.push(mediaValues.join(',\n'));
lines.push('ON CONFLICT (id) DO NOTHING;');
lines.push('');

lines.push('INSERT INTO rooms (id, property_id, name, type, price_monthly, surface_m2, floor, is_available, description_translations)');
lines.push('VALUES');
lines.push(roomValues.join(',\n'));
lines.push('ON CONFLICT (id) DO NOTHING;');

fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
console.error('Généré:', OUT, '(', propValues.length, 'biens,', roomValues.length, 'chambres )');
