import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import { getJerseyImageUrl, getFaceImageUrl } from './utils/imageUtils';
import { supabase } from './lib/supabase';

const AdminDashboard = ({ onLogout }) => {
  const [selectedSection, setSelectedSection] = useState('Premier League');
  const [activeTab, setActiveTab] = useState('jerseys');
  const [images, setImages] = useState({
    jerseys: [],
    faces: []
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [imageToChange, setImageToChange] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImageName, setNewImageName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // All sections available in the app
  const sections = [
    'Premier League',
    'EFL Championship', 
    'EFL League One',
    'EFL League Two',
    'Scottish Clubs',
    'Spanish Clubs',
    'NFL Teams',
    'NBA Teams',
    'MLB Teams',
    'Germany Clubs',
    'France Clubs',
    'Italy Clubs',
    'Holland Clubs'
  ];

  // Real image data organized by sections (from actual website)
  const sectionImages = {
    'Premier League': {
      jerseys: [
        { name: 'Arsenal', path: getJerseyImageUrl('Arsenal.jpg'), type: 'jersey' },
        { name: 'Aston Villa', path: getJerseyImageUrl('Aston Villa.jpg'), type: 'jersey' },
        { name: 'AFC Bournemouth', path: getJerseyImageUrl('AFC Bournemouth.jpg'), type: 'jersey' },
        { name: 'Brentford', path: getJerseyImageUrl('Brentford.jpg'), type: 'jersey' },
        { name: 'Brighton & Hove Albion', path: getJerseyImageUrl('Brighton & Hove Albion.jpg'), type: 'jersey' },
        { name: 'Burnley', path: getJerseyImageUrl('Burnley.jpg'), type: 'jersey' },
        { name: 'Chelsea', path: getJerseyImageUrl('chelsea_home_jersey.jpg'), type: 'jersey' },
        { name: 'Crystal Palace', path: '/jerseys/crystal_palace_home_jersey.jpg', type: 'jersey' },
        { name: 'Everton', path: '/jerseys/everton_home_jersey.jpg', type: 'jersey' },
        { name: 'Fulham', path: '/jerseys/fulham_home_jersey.jpg', type: 'jersey' },
        { name: 'Leeds United', path: '/jerseys/leeds_united_home_jersey.jpg', type: 'jersey' },
        { name: 'Liverpool', path: '/jerseys/liverpool_home_jersey.jpg', type: 'jersey' },
        { name: 'Manchester City', path: '/jerseys/manchester_city_home_jersey.jpg', type: 'jersey' },
        { name: 'Manchester United', path: '/jerseys/manchester_united_home_jersey.jpg', type: 'jersey' },
        { name: 'Newcastle United', path: '/jerseys/newcastle_united_home_jersey.jpg', type: 'jersey' },
        { name: 'Nottingham Forest', path: '/jerseys/nottingham_forest_home_jersey.jpg', type: 'jersey' },
        { name: 'Sunderland', path: '/jerseys/sunderland_home_jersey.jpg', type: 'jersey' },
        { name: 'Tottenham Hotspur', path: '/jerseys/tottenham_hotspur_home_jersey.jpg', type: 'jersey' },
        { name: 'West Ham United', path: '/jerseys/west_ham_united_home_jersey.jpg', type: 'jersey' }
      ],
      faces: [
        { name: 'Arsenal', path: getFaceImageUrl('Arsenal.png'), type: 'face' },
        { name: 'Aston Villa', path: getFaceImageUrl('Aston Villa.png'), type: 'face' },
        { name: 'AFC Bournemouth', path: getFaceImageUrl('AFC Bournemouth.png'), type: 'face' },
        { name: 'Brentford', path: getFaceImageUrl('Brentford.png'), type: 'face' },
        { name: 'Brighton & Hove Albion', path: getFaceImageUrl('Brighton & Hove Albion.png'), type: 'face' },
        { name: 'Burnley', path: getFaceImageUrl('Burnley.png'), type: 'face' },
        { name: 'Chelsea', path: getFaceImageUrl('Chelsea.png'), type: 'face' },
        { name: 'Crystal Palace', path: '/faces/Crystal Palace.png', type: 'face' },
        { name: 'Everton', path: '/faces/Everton.png', type: 'face' },
        { name: 'Fulham', path: '/faces/Fulham.png', type: 'face' },
        { name: 'Leeds United', path: '/faces/Leeds United.png', type: 'face' },
        { name: 'Liverpool', path: '/faces/Liverpool.png', type: 'face' },
        { name: 'Manchester City', path: '/faces/Manchester City.png', type: 'face' },
        { name: 'Manchester United', path: '/faces/Manchester United.png', type: 'face' },
        { name: 'Newcastle United', path: '/faces/Newcastle United.png', type: 'face' },
        { name: 'Nottingham Forest', path: '/faces/Nottingham Forest.jpg', type: 'face' },
        { name: 'Sunderland', path: '/faces/Sunderland.png', type: 'face' },
        { name: 'Tottenham Hotspur', path: '/faces/Tottenham Hotspur.png', type: 'face' },
        { name: 'West Ham United', path: '/faces/West Ham United.png', type: 'face' }
      ]
    },
    'EFL Championship': {
      jerseys: [
        { name: 'Birmingham City', path: '/jerseys/birmingham_city_home_jersey.jpg', type: 'jersey' },
        { name: 'Blackburn Rovers', path: '/jerseys/blackburn_rovers_home_jersey.jpg', type: 'jersey' },
        { name: 'Bristol City', path: '/jerseys/bristol_city_home_jersey.jpg', type: 'jersey' },
        { name: 'Bristol Rovers', path: '/jerseys/bristol_rovers_home_jersey.jpg', type: 'jersey' },
        { name: 'Cardiff City', path: '/jerseys/cardiff_city_home_jersey.jpg', type: 'jersey' },
        { name: 'Coventry City', path: '/jerseys/coventry_city_home_jersey.jpg', type: 'jersey' },
        { name: 'Derby County', path: '/jerseys/derby_county_home_jersey.jpg', type: 'jersey' },
        { name: 'Huddersfield Town', path: '/jerseys/huddersfield_town_home_jersey.jpg', type: 'jersey' },
        { name: 'Hull City', path: '/jerseys/hull_city_home_jersey.jpg', type: 'jersey' },
        { name: 'Ipswich Town', path: '/jerseys/ipswich_town_home_jersey.jpg', type: 'jersey' },
        { name: 'Leeds United', path: '/jerseys/leeds_united_home_jersey.jpg', type: 'jersey' },
        { name: 'Leicester City', path: '/jerseys/leicester_city_home_jersey.jpg', type: 'jersey' },
        { name: 'Middlesbrough', path: '/jerseys/middlesbrough_home_jersey.jpg', type: 'jersey' },
        { name: 'Millwall', path: '/jerseys/millwall_home_jersey.jpg', type: 'jersey' },
        { name: 'Norwich City', path: '/jerseys/norwich_city_home_jersey.jpg', type: 'jersey' },
        { name: 'Nottingham Forest', path: '/jerseys/nottingham_forest_home_jersey.jpg', type: 'jersey' },
        { name: 'Preston North End', path: '/jerseys/preston_north_end_home_jersey.jpg', type: 'jersey' },
        { name: 'Queens Park Rangers', path: '/jerseys/queens_park_rangers_home_jersey.jpg', type: 'jersey' },
        { name: 'Reading', path: '/jerseys/reading_home_jersey.jpg', type: 'jersey' },
        { name: 'Rotherham United', path: '/jerseys/rotherham_united_home_jersey.jpg', type: 'jersey' },
        { name: 'Sheffield United', path: '/jerseys/sheffield_united_home_jersey.jpg', type: 'jersey' },
        { name: 'Sheffield Wednesday', path: '/jerseys/sheffield_wednesday_home_jersey.jpg', type: 'jersey' },
        { name: 'Southampton', path: '/jerseys/southampton_home_jersey.jpg', type: 'jersey' },
        { name: 'Stoke City', path: '/jerseys/stoke_city_home_jersey.jpg', type: 'jersey' },
        { name: 'Sunderland', path: '/jerseys/sunderland_home_jersey.jpg', type: 'jersey' },
        { name: 'Swansea City', path: '/jerseys/swansea_city_home_jersey.jpg', type: 'jersey' },
        { name: 'Watford', path: '/jerseys/watford_home_jersey.jpg', type: 'jersey' },
        { name: 'West Bromwich Albion', path: '/jerseys/west_bromwich_albion_home_jersey.jpg', type: 'jersey' },
        { name: 'West Ham United', path: '/jerseys/west_ham_united_home_jersey.jpg', type: 'jersey' },
        { name: 'Wolverhampton Wanderers', path: '/jerseys/wolverhampton_wanderers_home_jersey.jpg', type: 'jersey' }
      ],
      faces: [
        { name: 'Birmingham City', path: '/faces/Birmingham City.png', type: 'face' },
        { name: 'Blackburn Rovers', path: '/faces/Blackburn Rovers.jpg', type: 'face' },
        { name: 'Bristol City', path: '/faces/Bristol City.png', type: 'face' },
        { name: 'Bristol Rovers', path: '/faces/Bristol Rovers.png', type: 'face' },
        { name: 'Cardiff City', path: '/faces/Cardiff City.png', type: 'face' },
        { name: 'Coventry City', path: '/faces/Coventry City.png', type: 'face' },
        { name: 'Derby County', path: '/faces/Derby County.png', type: 'face' },
        { name: 'Huddersfield Town', path: '/faces/Huddersfield Town.png', type: 'face' },
        { name: 'Hull City', path: '/faces/Hull City.png', type: 'face' },
        { name: 'Ipswich Town', path: '/faces/Ipswich Town.png', type: 'face' },
        { name: 'Leeds United', path: '/faces/Leeds United.png', type: 'face' },
        { name: 'Leicester City', path: '/faces/Leicester City.png', type: 'face' },
        { name: 'Middlesbrough', path: '/faces/Middlesbrough.png', type: 'face' },
        { name: 'Millwall', path: '/faces/Millwall.png', type: 'face' },
        { name: 'Norwich City', path: '/faces/Norwich City.png', type: 'face' },
        { name: 'Nottingham Forest', path: '/faces/Nottingham Forest.jpg', type: 'face' },
        { name: 'Preston North End', path: '/faces/Preston North End.png', type: 'face' },
        { name: 'Queens Park Rangers', path: '/faces/Queens Park Rangers.png', type: 'face' },
        { name: 'Reading', path: '/faces/Reading.jpg', type: 'face' },
        { name: 'Rotherham United', path: '/faces/Rotherham United.png', type: 'face' },
        { name: 'Sheffield United', path: '/faces/Sheffield United.png', type: 'face' },
        { name: 'Sheffield Wednesday', path: '/faces/Sheffield Wednesday.png', type: 'face' },
        { name: 'Southampton', path: '/faces/Southampton.png', type: 'face' },
        { name: 'Stoke City', path: '/faces/Stoke City.png', type: 'face' },
        { name: 'Sunderland', path: '/faces/Sunderland.png', type: 'face' },
        { name: 'Swansea City', path: '/faces/Swansea City.avif', type: 'face' },
        { name: 'Watford', path: '/faces/Watford.png', type: 'face' },
        { name: 'West Bromwich Albion', path: '/faces/West Bromwich Albion.png', type: 'face' },
        { name: 'West Ham United', path: '/faces/West Ham United.png', type: 'face' },
        { name: 'Wolverhampton Wanderers', path: '/faces/Wolverhampton Wanderers.png', type: 'face' }
      ]
    },
    'NBA Teams': {
      jerseys: [
        { name: 'Atlanta Hawks', path: '/jerseys/Atlanta Hawks.png', type: 'jersey' },
        { name: 'Boston Celtics', path: '/jerseys/Boston Celtics.png', type: 'jersey' },
        { name: 'Brooklyn Nets', path: '/jerseys/Brooklyn Nets.png', type: 'jersey' },
        { name: 'Charlotte Hornets', path: '/jerseys/Charlotte Hornets.png', type: 'jersey' },
        { name: 'Chicago Bulls', path: '/jerseys/Chicago Bulls.jpg', type: 'jersey' },
        { name: 'Cleveland Cavaliers', path: '/jerseys/Cleveland Cavaliers.png', type: 'jersey' },
        { name: 'Dallas Mavericks', path: '/jerseys/Dallas Mavericks.png', type: 'jersey' },
        { name: 'Denver Nuggets', path: '/jerseys/Denver Nuggets.png', type: 'jersey' },
        { name: 'Detroit Pistons', path: '/jerseys/Detroit Pistons.jpg', type: 'jersey' },
        { name: 'Golden State Warriors', path: '/jerseys/Golden State Warriors.png', type: 'jersey' },
        { name: 'Houston Rockets', path: '/jerseys/Houston Rockets.jpg', type: 'jersey' },
        { name: 'Indiana Pacers', path: '/jerseys/Indiana Pacers.png', type: 'jersey' },
        { name: 'Los Angeles Clippers', path: '/jerseys/Los Angeles Clippers.jpg', type: 'jersey' },
        { name: 'Los Angeles Lakers', path: '/jerseys/Los Angeles Lakers.png', type: 'jersey' },
        { name: 'Memphis Grizzlies', path: '/jerseys/Memphis Grizzlies.png', type: 'jersey' },
        { name: 'Miami Heat', path: '/jerseys/Miami Heat.png', type: 'jersey' },
        { name: 'Milwaukee Bucks', path: '/jerseys/Milwaukee Bucks.png', type: 'jersey' },
        { name: 'Minnesota Timberwolves', path: '/jerseys/Minnesota Timberwolves.png', type: 'jersey' },
        { name: 'New Orleans Pelicans', path: '/jerseys/New Orleans Pelicans.png', type: 'jersey' },
        { name: 'New York Knicks', path: '/jerseys/New York Knicks.png', type: 'jersey' },
        { name: 'Oklahoma City Thunder', path: '/jerseys/Oklahoma City Thunder.png', type: 'jersey' },
        { name: 'Orlando Magic', path: '/jerseys/Orlando Magic.png', type: 'jersey' },
        { name: 'Philadelphia 76ers', path: '/jerseys/Philadelphia 76ers.png', type: 'jersey' },
        { name: 'Phoenix Suns', path: '/jerseys/Phoenix Suns.png', type: 'jersey' },
        { name: 'Portland Trail Blazers', path: '/jerseys/Portland Trail Blazers.jpg', type: 'jersey' },
        { name: 'Sacramento Kings', path: '/jerseys/Sacramento Kings.png', type: 'jersey' },
        { name: 'San Antonio Spurs', path: '/jerseys/San Antonio Spurs.png', type: 'jersey' },
        { name: 'Toronto Raptors', path: '/jerseys/Toronto Raptors.jpg', type: 'jersey' },
        { name: 'Utah Jazz', path: '/jerseys/Utah Jazz.png', type: 'jersey' },
        { name: 'Washington Wizards', path: '/jerseys/Washington Wizards.png', type: 'jersey' }
      ],
      faces: [
        { name: 'Atlanta Hawks', path: '/faces/Atlanta Hawks.jpg', type: 'face' },
        { name: 'Boston Celtics', path: '/faces/Boston Celtics.jpg', type: 'face' },
        { name: 'Brooklyn Nets', path: '/faces/Brooklyn Nets.jpg', type: 'face' },
        { name: 'Charlotte Hornets', path: '/faces/Charlotte Hornets.jpg', type: 'face' },
        { name: 'Chicago Bulls', path: '/faces/Chicago Bulls.jpg', type: 'face' },
        { name: 'Cleveland Cavaliers', path: '/faces/Cleveland Cavaliers.jpg', type: 'face' },
        { name: 'Dallas Mavericks', path: '/faces/Dallas Mavericks.jpg', type: 'face' },
        { name: 'Denver Nuggets', path: '/faces/Denver Nuggets.jpg', type: 'face' },
        { name: 'Detroit Pistons', path: '/faces/Detroit Pistons.jpg', type: 'face' },
        { name: 'Golden State Warriors', path: '/faces/Golden State Warriors.jpg', type: 'face' },
        { name: 'Houston Rockets', path: '/faces/Houston Rockets.jpg', type: 'face' },
        { name: 'Indiana Pacers', path: '/faces/Indiana Pacers.jpg', type: 'face' },
        { name: 'Los Angeles Clippers', path: '/faces/Los Angeles Clippers.jpg', type: 'face' },
        { name: 'Los Angeles Lakers', path: '/faces/Los Angeles Lakers.jpg', type: 'face' },
        { name: 'Memphis Grizzlies', path: '/faces/Memphis Grizzlies.jpg', type: 'face' },
        { name: 'Miami Heat', path: '/faces/Miami Heat.jpg', type: 'face' },
        { name: 'Milwaukee Bucks', path: '/faces/Milwaukee Bucks.jpg', type: 'face' },
        { name: 'Minnesota Timberwolves', path: '/faces/Minnesota Timberwolves.jpg', type: 'face' },
        { name: 'New Orleans Pelicans', path: '/faces/New Orleans Pelicans.jpg', type: 'face' },
        { name: 'New York Knicks', path: '/faces/New York Knicks.jpg', type: 'face' },
        { name: 'Oklahoma City Thunder', path: '/faces/Oklahoma City Thunder.jpg', type: 'face' },
        { name: 'Orlando Magic', path: '/faces/Orlando Magic.jpg', type: 'face' },
        { name: 'Philadelphia 76ers', path: '/faces/Philadelphia 76ers.jpg', type: 'face' },
        { name: 'Phoenix Suns', path: '/faces/Phoenix Suns.jpg', type: 'face' },
        { name: 'Portland Trail Blazers', path: '/faces/Portland Trail Blazers.jpg', type: 'face' },
        { name: 'Sacramento Kings', path: '/faces/Sacramento Kings.jpg', type: 'face' },
        { name: 'San Antonio Spurs', path: '/faces/San Antonio Spurs.jpg', type: 'face' },
        { name: 'Toronto Raptors', path: '/faces/Toronto Raptors.jpg', type: 'face' },
        { name: 'Utah Jazz', path: '/faces/Utah Jazz.jpg', type: 'face' },
        { name: 'Washington Wizards', path: '/faces/Washington Wizards.jpg', type: 'face' }
      ]
    },
    'MLB Teams': {
      jerseys: [
        { name: 'Arizona Diamondbacks', path: '/jerseys/Arizona Diamondbacks.png', type: 'jersey' },
        { name: 'Atlanta Braves', path: '/jerseys/Atlanta Braves.jpg', type: 'jersey' },
        { name: 'Baltimore Orioles', path: '/jerseys/Baltimore Orioles.png', type: 'jersey' },
        { name: 'Boston Red Sox', path: '/jerseys/Boston Red Sox.png', type: 'jersey' },
        { name: 'Chicago Cubs', path: '/jerseys/Chicago Cubs.png', type: 'jersey' },
        { name: 'Chicago White Sox', path: '/jerseys/Chicago White Sox.png', type: 'jersey' },
        { name: 'Cincinnati Reds', path: '/jerseys/Cincinnati Reds.png', type: 'jersey' },
        { name: 'Cleveland Guardians', path: '/jerseys/Cleveland Guardians.jpg', type: 'jersey' },
        { name: 'Colorado Rockies', path: '/jerseys/Colorado Rockies.jpg', type: 'jersey' },
        { name: 'Detroit Tigers', path: '/jerseys/Detroit Tigers.png', type: 'jersey' },
        { name: 'Houston Astros', path: '/jerseys/Houston Astros.jpg', type: 'jersey' },
        { name: 'Kansas City Royals', path: '/jerseys/Kansas City Royals.png', type: 'jersey' },
        { name: 'Los Angeles Angels', path: '/jerseys/Los Angeles Angels.png', type: 'jersey' },
        { name: 'Los Angeles Dodgers', path: '/jerseys/Los Angeles Dodgers.png', type: 'jersey' },
        { name: 'Miami Marlins', path: '/jerseys/Miami Marlins.png', type: 'jersey' },
        { name: 'Milwaukee Brewers', path: '/jerseys/Milwaukee Brewers.png', type: 'jersey' },
        { name: 'Minnesota Twins', path: '/jerseys/Minnesota Twins.png', type: 'jersey' },
        { name: 'New York Mets', path: '/jerseys/New York Mets.png', type: 'jersey' },
        { name: 'New York Yankees', path: '/jerseys/New York Yankees.png', type: 'jersey' },
        { name: 'Oakland Athletics', path: '/jerseys/Oakland Athletics.png', type: 'jersey' },
        { name: 'Philadelphia Phillies', path: '/jerseys/Philadelphia Phillies.png', type: 'jersey' },
        { name: 'Pittsburgh Pirates', path: '/jerseys/Pittsburgh Pirates.png', type: 'jersey' },
        { name: 'San Diego Padres', path: '/jerseys/San Diego Padres.png', type: 'jersey' },
        { name: 'San Francisco Giants', path: '/jerseys/San Francisco Giants.png', type: 'jersey' },
        { name: 'Seattle Mariners', path: '/jerseys/Seattle Mariners.png', type: 'jersey' },
        { name: 'St. Louis Cardinals', path: '/jerseys/St. Louis Cardinals.jpg', type: 'jersey' },
        { name: 'Tampa Bay Rays', path: '/jerseys/Tampa Bay Rays.png', type: 'jersey' },
        { name: 'Texas Rangers', path: '/jerseys/Texas Rangers.png', type: 'jersey' },
        { name: 'Toronto Blue Jays', path: '/jerseys/Toronto Blue Jays.png', type: 'jersey' },
        { name: 'Washington Nationals', path: '/jerseys/Washington Nationals.png', type: 'jersey' }
      ],
      faces: [
        { name: 'Arizona Diamondbacks', path: '/faces/Arizona Diamondbacks.jpg', type: 'face' },
        { name: 'Atlanta Braves', path: '/faces/Atlanta Braves.jpg', type: 'face' },
        { name: 'Baltimore Orioles', path: '/faces/Baltimore Orioles.jpg', type: 'face' },
        { name: 'Boston Red Sox', path: '/faces/Boston Red Sox.jpg', type: 'face' },
        { name: 'Chicago Cubs', path: '/faces/Chicago Cubs.jpg', type: 'face' },
        { name: 'Chicago White Sox', path: '/faces/Chicago White Sox.jpg', type: 'face' },
        { name: 'Cincinnati Reds', path: '/faces/Cincinnati Reds.jpg', type: 'face' },
        { name: 'Cleveland Guardians', path: '/faces/Cleveland Guardians.jpg', type: 'face' },
        { name: 'Colorado Rockies', path: '/faces/Colorado Rockies.jpg', type: 'face' },
        { name: 'Detroit Tigers', path: '/faces/Detroit Tigers.jpg', type: 'face' },
        { name: 'Houston Astros', path: '/faces/Houston Astros.jpg', type: 'face' },
        { name: 'Kansas City Royals', path: '/faces/Kansas City Royals.jpg', type: 'face' },
        { name: 'Los Angeles Angels', path: '/faces/Los Angeles Angels.jpg', type: 'face' },
        { name: 'Los Angeles Dodgers', path: '/faces/Los Angeles Dodgers.jpg', type: 'face' },
        { name: 'Miami Marlins', path: '/faces/Miami Marlins.jpg', type: 'face' },
        { name: 'Milwaukee Brewers', path: '/faces/Milwaukee Brewers.jpg', type: 'face' },
        { name: 'Minnesota Twins', path: '/faces/Minnesota Twins.jpg', type: 'face' },
        { name: 'New York Mets', path: '/faces/New York Mets.jpg', type: 'face' },
        { name: 'New York Yankees', path: '/faces/New York Yankees.jpg', type: 'face' },
        { name: 'Oakland Athletics', path: '/faces/Oakland Athletics.jpg', type: 'face' },
        { name: 'Philadelphia Phillies', path: '/faces/Philadelphia Phillies.jpg', type: 'face' },
        { name: 'Pittsburgh Pirates', path: '/faces/Pittsburgh Pirates.jpg', type: 'face' },
        { name: 'San Diego Padres', path: '/faces/San Diego Padres.jpg', type: 'face' },
        { name: 'San Francisco Giants', path: '/faces/San Francisco Giants.jpg', type: 'face' },
        { name: 'Seattle Mariners', path: '/faces/Seattle Mariners.jpg', type: 'face' },
        { name: 'St. Louis Cardinals', path: '/faces/St. Louis Cardinals.jpg', type: 'face' },
        { name: 'Tampa Bay Rays', path: '/faces/Tampa Bay Rays.jpg', type: 'face' },
        { name: 'Texas Rangers', path: '/faces/Texas Rangers.jpg', type: 'face' },
        { name: 'Toronto Blue Jays', path: '/faces/Toronto Blue Jays.jpg', type: 'face' },
        { name: 'Washington Nationals', path: '/faces/Washington Nationals.jpg', type: 'face' }
      ]
    },
    'EFL League One': {
      jerseys: [
        { name: 'AFC Wimbledon', path: '/jerseys/afc_wimbledon_home_jersey.jpg', type: 'jersey' },
        { name: 'Barnsley', path: '/jerseys/barnsley_home_jersey.jpg', type: 'jersey' },
        { name: 'Blackpool', path: '/jerseys/blackpool_home_jersey.jpg', type: 'jersey' },
        { name: 'Bolton Wanderers', path: '/jerseys/bolton_wanderers_home_jersey.jpg', type: 'jersey' },
        { name: 'Bradford City', path: '/jerseys/bradford_city_home_jersey.jpg', type: 'jersey' },
        { name: 'Burton Albion', path: '/jerseys/burton_albion_home_jersey.jpg', type: 'jersey' },
        { name: 'Cardiff City', path: '/jerseys/cardiff_city_home_jersey.jpg', type: 'jersey' },
        { name: 'Doncaster Rovers', path: '/jerseys/doncaster_rovers_home_jersey.jpg', type: 'jersey' },
        { name: 'Exeter City', path: '/jerseys/exeter_city_home_jersey.jpg', type: 'jersey' },
        { name: 'Huddersfield Town', path: '/jerseys/huddersfield_town_home_jersey.jpg', type: 'jersey' },
        { name: 'Leyton Orient', path: '/jerseys/leyton_orient_home_jersey.jpg', type: 'jersey' },
        { name: 'Lincoln City', path: '/jerseys/lincoln_city_home_jersey.jpg', type: 'jersey' },
        { name: 'Luton Town', path: '/jerseys/luton_town_home_jersey.jpg', type: 'jersey' },
        { name: 'Mansfield Town', path: '/jerseys/mansfield_town_home_jersey.jpg', type: 'jersey' },
        { name: 'Northampton Town', path: '/jerseys/northampton_town_home_jersey.jpg', type: 'jersey' },
        { name: 'Peterborough United', path: '/jerseys/peterborough_united_home_jersey.jpg', type: 'jersey' },
        { name: 'Plymouth Argyle', path: '/jerseys/plymouth_argyle_home_jersey.jpg', type: 'jersey' },
        { name: 'Port Vale', path: '/jerseys/port_vale_home_jersey.jpg', type: 'jersey' },
        { name: 'Reading', path: '/jerseys/reading_home_jersey.jpg', type: 'jersey' },
        { name: 'Rotherham United', path: '/jerseys/rotherham_united_home_jersey.jpg', type: 'jersey' },
        { name: 'Stevenage', path: '/jerseys/stevenage_home_jersey.jpg', type: 'jersey' },
        { name: 'Stockport County', path: '/jerseys/stockport_county_home_jersey.jpg', type: 'jersey' }
      ],
      faces: [
        { name: 'AFC Wimbledon', path: '/faces/AFC Wimbledon.png', type: 'face' },
        { name: 'Barnsley', path: '/faces/Barnsley.png', type: 'face' },
        { name: 'Blackpool', path: '/faces/Blackpool.jpg', type: 'face' },
        { name: 'Bolton Wanderers', path: '/faces/Bolton Wanderers.png', type: 'face' },
        { name: 'Bradford City', path: '/faces/Bradford City.png', type: 'face' },
        { name: 'Burton Albion', path: '/faces/Burton Albion.png', type: 'face' },
        { name: 'Cardiff City', path: '/faces/Cardiff City.png', type: 'face' },
        { name: 'Doncaster Rovers', path: '/faces/Doncaster Rovers.png', type: 'face' },
        { name: 'Exeter City', path: '/faces/Exeter City.png', type: 'face' },
        { name: 'Huddersfield Town', path: '/faces/Huddersfield Town.png', type: 'face' },
        { name: 'Leyton Orient', path: '/faces/Leyton Orient.png', type: 'face' },
        { name: 'Lincoln City', path: '/faces/Lincoln City.png', type: 'face' },
        { name: 'Luton Town', path: '/faces/Luton Town.png', type: 'face' },
        { name: 'Mansfield Town', path: '/faces/Mansfield Town.png', type: 'face' },
        { name: 'Northampton Town', path: '/faces/Northampton Town.png', type: 'face' },
        { name: 'Peterborough United', path: '/faces/Peterborough United.png', type: 'face' },
        { name: 'Plymouth Argyle', path: '/faces/Plymouth Argyle.png', type: 'face' },
        { name: 'Port Vale', path: '/faces/Port Vale.png', type: 'face' },
        { name: 'Reading', path: '/faces/Reading.jpg', type: 'face' },
        { name: 'Rotherham United', path: '/faces/Rotherham United.png', type: 'face' },
        { name: 'Stevenage', path: '/faces/Stevenage.png', type: 'face' },
        { name: 'Stockport County', path: '/faces/Stockport County.png', type: 'face' }
      ]
    },
    'EFL League Two': {
      jerseys: [
        { name: 'Barnet', path: '/jerseys/barnet_home_jersey.jpg', type: 'jersey' },
        { name: 'Barrow', path: '/jerseys/barrow_home_jersey.jpg', type: 'jersey' },
        { name: 'Bristol Rovers', path: '/jerseys/bristol_rovers_home_jersey.jpg', type: 'jersey' },
        { name: 'Bromley', path: '/jerseys/bromley_home_jersey.jpg', type: 'jersey' },
        { name: 'Cambridge United', path: '/jerseys/cambridge_united_home_jersey.jpg', type: 'jersey' },
        { name: 'Cheltenham Town', path: '/jerseys/cheltenham_town_home_jersey.jpg', type: 'jersey' },
        { name: 'Chesterfield', path: '/jerseys/chesterfield_home_jersey.jpg', type: 'jersey' },
        { name: 'Colchester United', path: '/jerseys/colchester_united_home_jersey.jpg', type: 'jersey' },
        { name: 'Crawley Town', path: '/jerseys/crawley_town_home_jersey.jpg', type: 'jersey' },
        { name: 'Crewe Alexandra', path: '/jerseys/crewe_alexandra_home_jersey.jpg', type: 'jersey' },
        { name: 'Fleetwood Town', path: '/jerseys/fleetwood_town_home_jersey.jpg', type: 'jersey' },
        { name: 'Gillingham', path: '/jerseys/gillingham_home_jersey.jpg', type: 'jersey' },
        { name: 'Grimsby Town', path: '/jerseys/grimsby_town_home_jersey.jpg', type: 'jersey' },
        { name: 'Harrogate Town', path: '/jerseys/harrogate_town_home_jersey.jpg', type: 'jersey' },
        { name: 'Leyton Orient', path: '/jerseys/leyton_orient_home_jersey.jpg', type: 'jersey' },
        { name: 'Lincoln City', path: '/jerseys/lincoln_city_home_jersey.jpg', type: 'jersey' },
        { name: 'Mansfield Town', path: '/jerseys/mansfield_town_home_jersey.jpg', type: 'jersey' },
        { name: 'Newport County', path: '/jerseys/newport_county_home_jersey.jpg', type: 'jersey' },
        { name: 'Northampton Town', path: '/jerseys/northampton_town_home_jersey.jpg', type: 'jersey' },
        { name: 'Notts County', path: '/jerseys/notts_county_home_jersey.jpg', type: 'jersey' },
        { name: 'Oldham Athletic', path: '/jerseys/oldham_athletic_home_jersey.jpg', type: 'jersey' },
        { name: 'Oxford United', path: '/jerseys/oxford_united_home_jersey.jpg', type: 'jersey' },
        { name: 'Plymouth Argyle', path: '/jerseys/plymouth_argyle_home_jersey.jpg', type: 'jersey' },
        { name: 'Portsmouth', path: '/jerseys/portsmouth_home_jersey.jpg', type: 'jersey' },
        { name: 'Salford City', path: '/jerseys/salford_city_home_jersey.jpg', type: 'jersey' },
        { name: 'Shrewsbury Town', path: '/jerseys/shrewsbury_town_home_jersey.jpg', type: 'jersey' },
        { name: 'Stevenage', path: '/jerseys/stevenage_home_jersey.jpg', type: 'jersey' },
        { name: 'Stockport County', path: '/jerseys/stockport_county_home_jersey.jpg', type: 'jersey' },
        { name: 'Swindon Town', path: '/jerseys/swindon_town_home_jersey.jpg', type: 'jersey' },
        { name: 'Tranmere Rovers', path: '/jerseys/tranmere_rovers_home_jersey.jpg', type: 'jersey' },
        { name: 'Walsall FC', path: '/jerseys/walsall_fc_home_jersey.jpg', type: 'jersey' },
        { name: 'Wigan Athletic', path: '/jerseys/wigan_athletic_home_jersey.jpg', type: 'jersey' },
        { name: 'Wrexham', path: '/jerseys/wrexham_home_jersey.jpg', type: 'jersey' },
        { name: 'Wycombe Wanderers', path: '/jerseys/wycombe_wanderers_home_jersey.jpg', type: 'jersey' }
      ],
      faces: [
        { name: 'Barnet', path: '/faces/Barnet.jpg', type: 'face' },
        { name: 'Barrow', path: '/faces/Barrow.png', type: 'face' },
        { name: 'Bristol Rovers', path: '/faces/Bristol Rovers.png', type: 'face' },
        { name: 'Bromley', path: '/faces/Bromley.jpg', type: 'face' },
        { name: 'Cambridge United', path: '/faces/Cambridge United.png', type: 'face' },
        { name: 'Cheltenham Town', path: '/faces/Cheltenham Town.png', type: 'face' },
        { name: 'Chesterfield', path: '/faces/Chesterfield.png', type: 'face' },
        { name: 'Colchester United', path: '/faces/Colchester United.png', type: 'face' },
        { name: 'Crawley Town', path: '/faces/Crawley Town.png', type: 'face' },
        { name: 'Crewe Alexandra', path: '/faces/Crewe Alexandra.png', type: 'face' },
        { name: 'Fleetwood Town', path: '/faces/Fleetwood Town.png', type: 'face' },
        { name: 'Gillingham', path: '/faces/Gillingham.png', type: 'face' },
        { name: 'Grimsby Town', path: '/faces/Grimsby Town.png', type: 'face' },
        { name: 'Harrogate Town', path: '/faces/Harrogate Town.png', type: 'face' },
        { name: 'Leyton Orient', path: '/faces/Leyton Orient.png', type: 'face' },
        { name: 'Lincoln City', path: '/faces/Lincoln City.png', type: 'face' },
        { name: 'Mansfield Town', path: '/faces/Mansfield Town.png', type: 'face' },
        { name: 'Newport County', path: '/faces/Newport County.png', type: 'face' },
        { name: 'Northampton Town', path: '/faces/Northampton Town.png', type: 'face' },
        { name: 'Notts County', path: '/faces/Notts County.png', type: 'face' },
        { name: 'Oldham Athletic', path: '/faces/Oldham Athletic.png', type: 'face' },
        { name: 'Oxford United', path: '/faces/Oxford United.png', type: 'face' },
        { name: 'Plymouth Argyle', path: '/faces/Plymouth Argyle.png', type: 'face' },
        { name: 'Portsmouth', path: '/faces/Portsmouth.png', type: 'face' },
        { name: 'Salford City', path: '/faces/Salford City.png', type: 'face' },
        { name: 'Shrewsbury Town', path: '/faces/Shrewsbury Town.png', type: 'face' },
        { name: 'Stevenage', path: '/faces/Stevenage.png', type: 'face' },
        { name: 'Stockport County', path: '/faces/Stockport County.png', type: 'face' },
        { name: 'Swindon Town', path: '/faces/Swindon Town.png', type: 'face' },
        { name: 'Tranmere Rovers', path: '/faces/Tranmere Rovers.png', type: 'face' },
        { name: 'Walsall FC', path: '/faces/Walsall FC.png', type: 'face' },
        { name: 'Wigan Athletic', path: '/faces/Wigan Athletic.png', type: 'face' },
        { name: 'Wrexham', path: '/faces/Wrexham.png', type: 'face' },
        { name: 'Wycombe Wanderers', path: '/faces/Wycombe Wanderers.jpg', type: 'face' }
      ]
    },
    'Scottish Clubs': {
      jerseys: [
        { name: 'Aberdeen', path: '/jerseys/Aberdeen.jpg', type: 'jersey' },
        { name: 'Celtic', path: '/jerseys/Celtic.jpg', type: 'jersey' },
        { name: 'Dundee', path: '/jerseys/Dundee.jpg', type: 'jersey' },
        { name: 'Dundee United', path: '/jerseys/Dundee United.jpg', type: 'jersey' },
        { name: 'Falkirk', path: '/jerseys/Falkirk.jpg', type: 'jersey' },
        { name: 'Hibernian', path: '/jerseys/Hibernian.jpg', type: 'jersey' },
        { name: 'Kilmarnock', path: '/jerseys/Kilmarnock.jpg', type: 'jersey' },
        { name: 'Livingston', path: '/jerseys/Livingston.jpg', type: 'jersey' },
        { name: 'Motherwell', path: '/jerseys/Motherwell.jpg', type: 'jersey' },
        { name: 'Rangers', path: '/jerseys/Rangers.jpg', type: 'jersey' },
        { name: 'St Mirren', path: '/jerseys/St Mirren.jpg', type: 'jersey' }
      ],
      faces: [
        { name: 'Aberdeen', path: '/faces/Aberdeen.png', type: 'face' },
        { name: 'Celtic', path: '/faces/Celtic.png', type: 'face' },
        { name: 'Dundee', path: '/faces/Dundee.png', type: 'face' },
        { name: 'Dundee United', path: '/faces/Dundee United.jpg', type: 'face' },
        { name: 'Falkirk', path: '/faces/Falkirk.jpg', type: 'face' },
        { name: 'Hibernian', path: '/faces/Hibernian.png', type: 'face' },
        { name: 'Kilmarnock', path: '/faces/Kilmarnock.png', type: 'face' },
        { name: 'Livingston', path: '/faces/Livingston.jpg', type: 'face' },
        { name: 'Motherwell', path: '/faces/Motherwell.png', type: 'face' },
        { name: 'Rangers', path: '/faces/Rangers.png', type: 'face' },
        { name: 'St Mirren', path: '/faces/St Mirren.png', type: 'face' }
      ]
    },
    'Spanish Clubs': {
      jerseys: [
        { name: 'Alaves', path: '/jerseys/Alaves.jpg', type: 'jersey' },
        { name: 'Atletico Madrid', path: '/jerseys/Atletico Madrid.jpg', type: 'jersey' },
        { name: 'Barcelona', path: '/jerseys/Barcelona.jpg', type: 'jersey' },
        { name: 'Celta Vigo', path: '/jerseys/Celta Vigo.jpg', type: 'jersey' },
        { name: 'Espanyol', path: '/jerseys/Espanyol.jpg', type: 'jersey' },
        { name: 'Getafe', path: '/jerseys/Getafe.jpg', type: 'jersey' },
        { name: 'Girona', path: '/jerseys/Girona.jpg', type: 'jersey' },
        { name: 'Levante', path: '/jerseys/Levante.jpg', type: 'jersey' },
        { name: 'Mallorca', path: '/jerseys/Mallorca.jpg', type: 'jersey' },
        { name: 'Osasuna', path: '/jerseys/Osasuna.jpg', type: 'jersey' },
        { name: 'Oviedo', path: '/jerseys/Oviedo.jpg', type: 'jersey' },
        { name: 'Rayo Vallecano', path: '/jerseys/Rayo Vallecano.jpg', type: 'jersey' },
        { name: 'Real Betis', path: '/jerseys/Real Betis.jpg', type: 'jersey' },
        { name: 'Real Madrid', path: '/jerseys/Real Madrid.jpg', type: 'jersey' },
        { name: 'Sevilla', path: '/jerseys/Sevilla.jpg', type: 'jersey' },
        { name: 'Valencia', path: '/jerseys/Valencia.jpg', type: 'jersey' },
        { name: 'Villarreal', path: '/jerseys/Villarreal.jpg', type: 'jersey' }
      ],
      faces: [
        { name: 'Alaves', path: '/faces/Alaves.png', type: 'face' },
        { name: 'Atletico Madrid', path: '/faces/Atletico Madrid.png', type: 'face' },
        { name: 'Barcelona', path: '/faces/Barcelona.png', type: 'face' },
        { name: 'Celta Vigo', path: '/faces/Celta Vigo.png', type: 'face' },
        { name: 'Espanyol', path: '/faces/Espanyol.png', type: 'face' },
        { name: 'Getafe', path: '/faces/Getafe.png', type: 'face' },
        { name: 'Girona', path: '/faces/Girona.png', type: 'face' },
        { name: 'Levante', path: '/faces/Levante.png', type: 'face' },
        { name: 'Mallorca', path: '/faces/Mallorca.png', type: 'face' },
        { name: 'Osasuna', path: '/faces/Osasuna.png', type: 'face' },
        { name: 'Oviedo', path: '/faces/Oviedo.png', type: 'face' },
        { name: 'Rayo Vallecano', path: '/faces/Rayo Vallecano.png', type: 'face' },
        { name: 'Real Betis', path: '/faces/Real Betis.png', type: 'face' },
        { name: 'Real Madrid', path: '/faces/Real Madrid.png', type: 'face' },
        { name: 'Sevilla', path: '/faces/Sevilla.png', type: 'face' },
        { name: 'Valencia', path: '/faces/Valencia.png', type: 'face' },
        { name: 'Villarreal', path: '/faces/Villarreal.png', type: 'face' }
      ]
    },
    'NFL Teams': {
      jerseys: [
        { name: 'Arizona Cardinals', path: '/jerseys/Arizona Cardinals.png', type: 'jersey' },
        { name: 'Atlanta Falcons', path: '/jerseys/Atlanta Falcons.jpg', type: 'jersey' },
        { name: 'Baltimore Ravens', path: '/jerseys/Baltimore Ravens.png', type: 'jersey' },
        { name: 'Buffalo Bills', path: '/jerseys/Buffalo Bills.png', type: 'jersey' },
        { name: 'Carolina Panthers', path: '/jerseys/Carolina Panthers.png', type: 'jersey' },
        { name: 'Chicago Bears', path: '/jerseys/Chicago Bears.png', type: 'jersey' },
        { name: 'Cincinnati Bengals', path: '/jerseys/Cincinnati Bengals.png', type: 'jersey' },
        { name: 'Cleveland Browns', path: '/jerseys/Cleveland Browns.png', type: 'jersey' },
        { name: 'Dallas Cowboys', path: '/jerseys/Dallas Cowboys.png', type: 'jersey' },
        { name: 'Denver Broncos', path: '/jerseys/Denver Broncos.png', type: 'jersey' },
        { name: 'Detroit Lions', path: '/jerseys/Detroit Lions.png', type: 'jersey' },
        { name: 'Green Bay Packers', path: '/jerseys/Green Bay Packers.png', type: 'jersey' },
        { name: 'Houston Texans', path: '/jerseys/Houston Texans.jpg', type: 'jersey' },
        { name: 'Indianapolis Colts', path: '/jerseys/Indianapolis Colts.png', type: 'jersey' },
        { name: 'Jacksonville Jaguars', path: '/jerseys/Jacksonville-Jaguars.png', type: 'jersey' },
        { name: 'Kansas City Chiefs', path: '/jerseys/Kansas-City-Chiefs.png', type: 'jersey' },
        { name: 'Las Vegas Raiders', path: '/jerseys/Las-Vegas-Raiders.png', type: 'jersey' },
        { name: 'Los Angeles Chargers', path: '/jerseys/Los-Angeles-Chargers.png', type: 'jersey' },
        { name: 'Los Angeles Rams', path: '/jerseys/Los-Angeles-Rams.png', type: 'jersey' },
        { name: 'Miami Dolphins', path: '/jerseys/Miami Dolphins.jpg', type: 'jersey' },
        { name: 'Minnesota Vikings', path: '/jerseys/Minnesota-Vikings.png', type: 'jersey' },
        { name: 'New England Patriots', path: '/jerseys/New England Patriots.jpg', type: 'jersey' },
        { name: 'New Orleans Saints', path: '/jerseys/New-Orleans-Saints.png', type: 'jersey' },
        { name: 'New York Giants', path: '/jerseys/New York Giants.jpg', type: 'jersey' },
        { name: 'New York Jets', path: '/jerseys/New-York-Jets.png', type: 'jersey' },
        { name: 'Philadelphia Eagles', path: '/jerseys/Philadelphia-Eagles.png', type: 'jersey' },
        { name: 'Pittsburgh Steelers', path: '/jerseys/Pittsburgh Steelers.png', type: 'jersey' },
        { name: 'San Francisco 49ers', path: '/jerseys/San Francisco 49ers.png', type: 'jersey' },
        { name: 'Seattle Seahawks', path: '/jerseys/Seattle Seahawks.png', type: 'jersey' },
        { name: 'Tampa Bay Buccaneers', path: '/jerseys/Tampa Bay Buccaneers.jpg', type: 'jersey' },
        { name: 'Tennessee Titans', path: '/jerseys/Tennessee Titans.png', type: 'jersey' },
        { name: 'Washington Commanders', path: '/jerseys/Washington Commanders.png', type: 'jersey' }
      ],
      faces: [
        { name: 'Arizona Cardinals', path: '/faces/Arizona Cardinals.jpg', type: 'face' },
        { name: 'Atlanta Falcons', path: '/faces/Atlanta Falcons.jpg', type: 'face' },
        { name: 'Baltimore Ravens', path: '/faces/Baltimore Ravens.jpg', type: 'face' },
        { name: 'Buffalo Bills', path: '/faces/Buffalo Bills.jpg', type: 'face' },
        { name: 'Carolina Panthers', path: '/faces/Carolina Panthers.jpg', type: 'face' },
        { name: 'Chicago Bears', path: '/faces/Chicago Bears.jpg', type: 'face' },
        { name: 'Cincinnati Bengals', path: '/faces/Cincinnati Bengals.jpg', type: 'face' },
        { name: 'Cleveland Browns', path: '/faces/Cleveland Browns.jpg', type: 'face' },
        { name: 'Dallas Cowboys', path: '/faces/Dallas Cowboys.jpg', type: 'face' },
        { name: 'Denver Broncos', path: '/faces/Denver Broncos.jpg', type: 'face' },
        { name: 'Detroit Lions', path: '/faces/Detroit Lions.jpg', type: 'face' },
        { name: 'Green Bay Packers', path: '/faces/Green Bay Packers.jpg', type: 'face' },
        { name: 'Houston Texans', path: '/faces/Houston Texans.jpg', type: 'face' },
        { name: 'Indianapolis Colts', path: '/faces/Indianapolis Colts.jpg', type: 'face' },
        { name: 'Jacksonville Jaguars', path: '/faces/Jacksonville Jaguars.jpg', type: 'face' },
        { name: 'Kansas City Chiefs', path: '/faces/Kansas City Chiefs.jpg', type: 'face' },
        { name: 'Las Vegas Raiders', path: '/faces/Las Vegas Raiders.jpg', type: 'face' },
        { name: 'Los Angeles Chargers', path: '/faces/Los Angeles Chargers.jpg', type: 'face' },
        { name: 'Los Angeles Rams', path: '/faces/Los Angeles Rams.jpg', type: 'face' },
        { name: 'Miami Dolphins', path: '/faces/Miami Dolphins.jpg', type: 'face' },
        { name: 'Minnesota Vikings', path: '/faces/Minnesota Vikings.jpg', type: 'face' },
        { name: 'New England Patriots', path: '/faces/New England Patriots.jpg', type: 'face' },
        { name: 'New Orleans Saints', path: '/faces/New Orleans Saints.jpg', type: 'face' },
        { name: 'New York Giants', path: '/faces/New York Giants.jpg', type: 'face' },
        { name: 'New York Jets', path: '/faces/New York Jets.jpg', type: 'face' },
        { name: 'Philadelphia Eagles', path: '/faces/Philadelphia Eagles.jpg', type: 'face' },
        { name: 'Pittsburgh Steelers', path: '/faces/Pittsburgh Steelers.jpg', type: 'face' },
        { name: 'San Francisco 49ers', path: '/faces/San Francisco 49ers.jpg', type: 'face' },
        { name: 'Seattle Seahawks', path: '/faces/Seattle Seahawks.jpg', type: 'face' },
        { name: 'Tampa Bay Buccaneers', path: '/faces/Tampa Bay Buccaneers.jpg', type: 'face' },
        { name: 'Tennessee Titans', path: '/faces/Tennessee Titans.jpg', type: 'face' },
        { name: 'Washington Commanders', path: '/faces/Washington Commanders.jpg', type: 'face' }
      ]
    },
    'Germany Clubs': {
      jerseys: [
        { name: 'Bayer Leverkusen', path: '/jerseys/Bayer Leverkusen.jpg', type: 'jersey' },
        { name: 'Bayern Munich', path: '/jerseys/Bayern Munich.jpg', type: 'jersey' },
        { name: 'Borussia Dortmund', path: '/jerseys/Borussia Dortmund.jpg', type: 'jersey' },
        { name: 'Borussia Mönchengladbach', path: '/jerseys/Borussia Mönchengladbach.jpg', type: 'jersey' },
        { name: 'Eintracht Frankfurt', path: '/jerseys/Eintracht Frankfurt.jpg', type: 'jersey' },
        { name: 'FC Augsburg', path: '/jerseys/FC Augsburg.jpg', type: 'jersey' },
        { name: 'FC Köln', path: '/jerseys/FC Köln.jpg', type: 'jersey' },
        { name: 'Fortuna Düsseldorf', path: '/jerseys/Fortuna Düsseldorf.jpg', type: 'jersey' },
        { name: 'FSV Mainz 05', path: '/jerseys/FSV Mainz 05.jpg', type: 'jersey' },
        { name: 'Hamburger SV', path: '/jerseys/Hamburger SV.jpg', type: 'jersey' },
        { name: 'Hannover 96', path: '/jerseys/Hannover 96.jpg', type: 'jersey' },
        { name: 'Hertha BSC', path: '/jerseys/Hertha BSC.jpg', type: 'jersey' },
        { name: 'RB Leipzig', path: '/jerseys/RB Leipzig.jpg', type: 'jersey' },
        { name: 'SC Freiburg', path: '/jerseys/SC Freiburg.jpg', type: 'jersey' },
        { name: 'Union Berlin', path: '/jerseys/Union Berlin.jpg', type: 'jersey' },
        { name: 'VfB Stuttgart', path: '/jerseys/VfB Stuttgart.jpg', type: 'jersey' },
        { name: 'VfL Bochum', path: '/jerseys/VfL Bochum.jpg', type: 'jersey' },
        { name: 'VfL Wolfsburg', path: '/jerseys/VfL Wolfsburg.jpg', type: 'jersey' },
        { name: 'Werder Bremen', path: '/jerseys/Werder Bremen.jpg', type: 'jersey' }
      ],
      faces: [
        { name: 'Bayer Leverkusen', path: '/faces/Bayer Leverkusen.png', type: 'face' },
        { name: 'Bayern Munich', path: '/faces/Bayern Munich.png', type: 'face' },
        { name: 'Borussia Dortmund', path: '/faces/Borussia Dortmund.png', type: 'face' },
        { name: 'Borussia Mönchengladbach', path: '/faces/Borussia Mönchengladbach.png', type: 'face' },
        { name: 'Eintracht Frankfurt', path: '/faces/Eintracht Frankfurt.png', type: 'face' },
        { name: 'FC Augsburg', path: '/faces/FC Augsburg.png', type: 'face' },
        { name: 'FC Köln', path: '/faces/FC Köln.png', type: 'face' },
        { name: 'Fortuna Düsseldorf', path: '/faces/Fortuna Düsseldorf.png', type: 'face' },
        { name: 'FSV Mainz 05', path: '/faces/FSV Mainz 05.png', type: 'face' },
        { name: 'Hamburger SV', path: '/faces/Hamburger SV.jpg', type: 'face' },
        { name: 'Hannover 96', path: '/faces/Hannover 96.png', type: 'face' },
        { name: 'Hertha BSC', path: '/faces/Hertha BSC.jpg', type: 'face' },
        { name: 'RB Leipzig', path: '/faces/RB Leipzig.png', type: 'face' },
        { name: 'SC Freiburg', path: '/faces/SC Freiburg.png', type: 'face' },
        { name: 'Union Berlin', path: '/faces/Union Berlin.png', type: 'face' },
        { name: 'VfB Stuttgart', path: '/faces/VfB Stuttgart.png', type: 'face' },
        { name: 'VfL Bochum', path: '/faces/VfL Bochum.png', type: 'face' },
        { name: 'VfL Wolfsburg', path: '/faces/VfL Wolfsburg.png', type: 'face' },
        { name: 'Werder Bremen', path: '/faces/Werder Bremen.png', type: 'face' }
      ]
    },
    'France Clubs': {
      jerseys: [
        { name: 'AJ Auxerre', path: '/jerseys/AJ Auxerre.jpg', type: 'jersey' },
        { name: 'Angers SCO', path: '/jerseys/Angers SCO.jpg', type: 'jersey' },
        { name: 'AS Monaco', path: '/jerseys/AS Monaco.jpg', type: 'jersey' },
        { name: 'ESTAC Troyes', path: '/jerseys/ESTAC Troyes.jpg', type: 'jersey' },
        { name: 'FC Metz', path: '/jerseys/FC Metz.jpg', type: 'jersey' },
        { name: 'FC Nantes', path: '/jerseys/FC Nantes.jpg', type: 'jersey' },
        { name: 'Montpellier HSC', path: '/jerseys/Montpellier HSC.jpg', type: 'jersey' },
        { name: 'OGC Nice', path: '/jerseys/OGC Nice.jpg', type: 'jersey' },
        { name: 'Olympique Lyonnais', path: '/jerseys/Olympique Lyonnais (Lyon).jpg', type: 'jersey' },
        { name: 'Paris Saint-Germain', path: '/jerseys/Paris Saint-Germain (PSG).jpg', type: 'jersey' },
        { name: 'RC Lens', path: '/jerseys/RC Lens.jpg', type: 'jersey' },
        { name: 'RC Strasbourg Alsace', path: '/jerseys/RC Strasbourg Alsace.jpg', type: 'jersey' },
        { name: 'Stade Brestois', path: '/jerseys/Stade Brestois (Brest).jpg', type: 'jersey' },
        { name: 'Stade de Reims', path: '/jerseys/Stade de Reims.jpg', type: 'jersey' },
        { name: 'Stade Rennais', path: '/jerseys/Stade Rennais (Rennes).jpg', type: 'jersey' },
        { name: 'Toulouse FC', path: '/jerseys/Toulouse FC.jpg', type: 'jersey' }
      ],
      faces: [
        { name: 'AJ Auxerre', path: '/faces/AJ Auxerre.png', type: 'face' },
        { name: 'Angers SCO', path: '/faces/Angers SCO.jpg', type: 'face' },
        { name: 'AS Monaco', path: '/faces/AS Monaco.png', type: 'face' },
        { name: 'ESTAC Troyes', path: '/faces/ESTAC Troyes.png', type: 'face' },
        { name: 'FC Metz', path: '/faces/FC Metz.png', type: 'face' },
        { name: 'FC Nantes', path: '/faces/FC Nantes.png', type: 'face' },
        { name: 'Montpellier HSC', path: '/faces/Montpellier HSC.png', type: 'face' },
        { name: 'OGC Nice', path: '/faces/OGC Nice.png', type: 'face' },
        { name: 'Olympique Lyonnais', path: '/faces/Olympique Lyonnais.png', type: 'face' },
        { name: 'Paris Saint-Germain', path: '/faces/Paris Saint-Germain (PSG).png', type: 'face' },
        { name: 'RC Lens', path: '/faces/RC Lens.png', type: 'face' },
        { name: 'RC Strasbourg Alsace', path: '/faces/RC Strasbourg Alsace.jpg', type: 'face' },
        { name: 'Stade Brestois', path: '/faces/Stade Brestois.jpeg', type: 'face' },
        { name: 'Stade de Reims', path: '/faces/Stade de Reims.jpg', type: 'face' },
        { name: 'Stade Rennais', path: '/faces/Stade Rennais.png', type: 'face' },
        { name: 'Toulouse FC', path: '/faces/Toulouse FC.jpg', type: 'face' }
      ]
    },
    'Italy Clubs': {
      jerseys: [
        { name: 'AC Milan', path: '/jerseys/AC Milan.jpg', type: 'jersey' },
        { name: 'AS Roma', path: '/jerseys/AS Roma.jpg', type: 'jersey' },
        { name: 'Atalanta', path: '/jerseys/Atalanta.jpg', type: 'jersey' },
        { name: 'Bologna', path: '/jerseys/Bologna.jpg', type: 'jersey' },
        { name: 'Cremonese', path: '/jerseys/Cremonese.jpg', type: 'jersey' },
        { name: 'Empoli', path: '/jerseys/Empoli.jpg', type: 'jersey' },
        { name: 'Fiorentina', path: '/jerseys/Fiorentina.jpg', type: 'jersey' },
        { name: 'Hellas Verona', path: '/jerseys/Hellas Verona.jpg', type: 'jersey' },
        { name: 'Inter Milan', path: '/jerseys/Inter Milan (Internazionale).jpg', type: 'jersey' },
        { name: 'Juventus', path: '/jerseys/Juventus.jpg', type: 'jersey' },
        { name: 'Lazio', path: '/jerseys/Lazio.jpg', type: 'jersey' },
        { name: 'Lecce', path: '/jerseys/Lecce.jpg', type: 'jersey' },
        { name: 'Monza', path: '/jerseys/Monza.jpg', type: 'jersey' },
        { name: 'Salernitana', path: '/jerseys/Salernitana.jpg', type: 'jersey' },
        { name: 'Sampdoria', path: '/jerseys/Sampdoria.jpg', type: 'jersey' },
        { name: 'Sassuolo', path: '/jerseys/Sassuolo.jpg', type: 'jersey' },
        { name: 'Spezia', path: '/jerseys/Spezia.jpg', type: 'jersey' },
        { name: 'SSC Napoli', path: '/jerseys/SSC Napoli.jpg', type: 'jersey' },
        { name: 'Torino', path: '/jerseys/Torino.jpg', type: 'jersey' },
        { name: 'Udinese', path: '/jerseys/Udinese.jpg', type: 'jersey' }
      ],
      faces: [
        { name: 'AC Milan', path: '/faces/AC Milan.png', type: 'face' },
        { name: 'AS Roma', path: '/faces/AS Roma.png', type: 'face' },
        { name: 'Atalanta', path: '/faces/Atalanta.png', type: 'face' },
        { name: 'Bologna', path: '/faces/Bologna.jpeg', type: 'face' },
        { name: 'Cremonese', path: '/faces/Cremonese.png', type: 'face' },
        { name: 'Empoli', path: '/faces/Empoli.jpeg', type: 'face' },
        { name: 'Fiorentina', path: '/faces/Fiorentina.png', type: 'face' },
        { name: 'Hellas Verona', path: '/faces/Hellas Verona.png', type: 'face' },
        { name: 'Inter Milan', path: '/faces/Inter Milan.png', type: 'face' },
        { name: 'Juventus', path: '/faces/Juventus.png', type: 'face' },
        { name: 'Lazio', path: '/faces/Lazio.png', type: 'face' },
        { name: 'Lecce', path: '/faces/Lecce.png', type: 'face' },
        { name: 'Monza', path: '/faces/Monza.jpg', type: 'face' },
        { name: 'Salernitana', path: '/faces/Salernitana.png', type: 'face' },
        { name: 'Sampdoria', path: '/faces/Sampdoria.png', type: 'face' },
        { name: 'Sassuolo', path: '/faces/Sassuolo.png', type: 'face' },
        { name: 'Spezia', path: '/faces/Spezia.png', type: 'face' },
        { name: 'SSC Napoli', path: '/faces/SSC Napoli.jpg', type: 'face' },
        { name: 'Torino', path: '/faces/Torino.png', type: 'face' },
        { name: 'Udinese', path: '/faces/Udinese.png', type: 'face' }
      ]
    },
    'Holland Clubs': {
      jerseys: [
        { name: 'ADO Den Haag', path: '/jerseys/ADO Den Haag.jpg', type: 'jersey' },
        { name: 'AZ Alkmaar', path: '/jerseys/AZ Alkmaar.jpg', type: 'jersey' },
        { name: 'Cambuur', path: '/jerseys/Cambuur.jpg', type: 'jersey' },
        { name: 'Excelsior', path: '/jerseys/Excelsior.jpg', type: 'jersey' },
        { name: 'FC Groningen', path: '/jerseys/FC Groningen.jpg', type: 'jersey' },
        { name: 'FC Twente', path: '/jerseys/FC Twente.jpg', type: 'jersey' },
        { name: 'FC Utrecht', path: '/jerseys/FC Utrecht.jpg', type: 'jersey' },
        { name: 'Feyenoord', path: '/jerseys/Feyenoord.jpg', type: 'jersey' },
        { name: 'Fortuna Sittard', path: '/jerseys/Fortuna Sittard.jpg', type: 'jersey' },
        { name: 'Heracles Almelo', path: '/jerseys/Heracles Almelo.jpg', type: 'jersey' },
        { name: 'NEC Nijmegen', path: '/jerseys/NEC Nijmegen.jpg', type: 'jersey' },
        { name: 'PEC Zwolle', path: '/jerseys/PEC Zwolle.jpg', type: 'jersey' },
        { name: 'RKC Waalwijk', path: '/jerseys/RKC Waalwijk.jpg', type: 'jersey' },
        { name: 'SC Heerenveen', path: '/jerseys/SC Heerenveen.jpg', type: 'jersey' },
        { name: 'Sparta Rotterdam', path: '/jerseys/Sparta Rotterdam.jpg', type: 'jersey' },
        { name: 'Vitesse', path: '/jerseys/Vitesse.jpg', type: 'jersey' }
      ],
      faces: [
        { name: 'ADO Den Haag', path: '/faces/ADO Den Haag.png', type: 'face' },
        { name: 'AZ Alkmaar', path: '/faces/AZ Alkmaar.png', type: 'face' },
        { name: 'Cambuur', path: '/faces/Cambuur.jpg', type: 'face' },
        { name: 'Excelsior', path: '/faces/Excelsior.png', type: 'face' },
        { name: 'FC Groningen', path: '/faces/FC Groningen.png', type: 'face' },
        { name: 'FC Twente', path: '/faces/FC Twente.png', type: 'face' },
        { name: 'FC Utrecht', path: '/faces/FC Utrecht.jpg', type: 'face' },
        { name: 'Feyenoord', path: '/faces/Feyenoord.png', type: 'face' },
        { name: 'Fortuna Sittard', path: '/faces/Fortuna Sittard.png', type: 'face' },
        { name: 'Heracles Almelo', path: '/faces/Heracles Almelo.png', type: 'face' },
        { name: 'NEC Nijmegen', path: '/faces/NEC Nijmegen.png', type: 'face' },
        { name: 'PEC Zwolle', path: '/faces/PEC Zwolle.png', type: 'face' },
        { name: 'RKC Waalwijk', path: '/faces/RKC Waalwijk.jpg', type: 'face' },
        { name: 'SC Heerenveen', path: '/faces/SC Heerenveen.png', type: 'face' },
        { name: 'Sparta Rotterdam', path: '/faces/Sparta Rotterdam.jpg', type: 'face' },
        { name: 'Vitesse', path: '/faces/Vitesse.png', type: 'face' }
      ]
    }
    // Add more sections as needed
  };

  useEffect(() => {
    loadSectionImages();
  }, []);

  const loadSectionImages = async () => {
    try {
      setLoading(true);
      console.log('Loading all images from Supabase...');
      
      // Fetch all jerseys from Supabase Storage
      const { data: jerseysData, error: jerseysError } = await supabase.storage
        .from('jerseys')
        .list('', { limit: 1000 });
      
      // Fetch all faces from Supabase Storage
      const { data: facesData, error: facesError } = await supabase.storage
        .from('faces')
        .list('', { limit: 1000 });
      
      if (jerseysError) {
        console.error('Error loading jerseys:', jerseysError);
      }
      
      if (facesError) {
        console.error('Error loading faces:', facesError);
      }
      
      // Transform ALL jerseys from Supabase
      const jerseys = jerseysData
        ? jerseysData
            .filter(file => {
              // Check if file has valid extension
              return file.name && (
                file.name.endsWith('.jpg') || 
                file.name.endsWith('.jpeg') || 
                file.name.endsWith('.png') || 
                file.name.endsWith('.avif')
              );
            })
            .map(file => ({
              name: file.name.replace(/\.(jpg|jpeg|png|avif)$/i, ''),
              path: getJerseyImageUrl(file.name),
              type: 'jersey',
              key: file.name
            }))
        : [];
      
      // Transform ALL faces from Supabase
      const faces = facesData
        ? facesData
            .filter(file => {
              // Check if file has valid extension
              return file.name && (
                file.name.endsWith('.jpg') || 
                file.name.endsWith('.jpeg') || 
                file.name.endsWith('.png') || 
                file.name.endsWith('.avif')
              );
            })
            .map(file => ({
              name: file.name.replace(/\.(jpg|jpeg|png|avif)$/i, ''),
              path: getFaceImageUrl(file.name),
              type: 'face',
              key: file.name
            }))
        : [];
      
      console.log('Total jerseys loaded:', jerseys.length);
      console.log('Total faces loaded:', faces.length);
      
      setImages({
        jerseys,
        faces
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading images from Supabase:', error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminUsername');
    onLogout();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImageFile(file);
      setNewImageName(file.name.split('.')[0]); // Remove extension
    }
  };

  const handleUploadImage = async () => {
    if (!newImageFile || !newImageName) return;

    setUploading(true);
    
    try {
      // Determine which Supabase bucket to upload to
      const bucketName = activeTab === 'jerseys' ? 'jerseys' : 'faces';
      const fileName = newImageFile.name;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, newImageFile, {
          contentType: newImageFile.type,
          upsert: true
        });
      
      if (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image: ' + error.message);
        setUploading(false);
        return;
      }
      
      // Reload images from Supabase to get the new image
      await loadSectionImages();
      
      setNewImageFile(null);
      setNewImageName('');
      setShowUploadModal(false);
      setUploading(false);
      
      alert('Image uploaded successfully to Supabase!');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image: ' + error.message);
      setUploading(false);
    }
  };

  const handleChangeImage = async () => {
    if (!newImageFile || !imageToChange) return;

    setUploading(true);
    
    try {
      // Determine which Supabase bucket
      const bucketName = activeTab === 'jerseys' ? 'jerseys' : 'faces';
      
      // Get the old file name (with extension)
      let oldFileName = imageToChange.key || imageToChange.name;
      
      // Extract file name from path if it's a full path
      if (oldFileName.includes('/')) {
        oldFileName = oldFileName.split('/').pop();
      }
      
      // If old file has no extension, try to find it from the image path
      if (!oldFileName.includes('.')) {
        // Try to extract from the path if available
        if (imageToChange.path) {
          const pathParts = imageToChange.path.split('/');
          const pathFile = pathParts[pathParts.length - 1];
          if (pathFile.includes('.')) {
            oldFileName = pathFile;
          }
        }
        
        // If still no extension, try to match from all images
        const allImages = images[activeTab];
        const foundImage = allImages.find(img => img.name === imageToChange.name && img.key);
        if (foundImage && foundImage.key) {
          oldFileName = foundImage.key;
        } else {
          // Last resort: try common extensions
          const possibleExtensions = ['.jpg', '.jpeg', '.png', '.avif', '.webp'];
          for (const ext of possibleExtensions) {
            const testName = imageToChange.name + ext;
            const { data } = await supabase.storage.from(bucketName).list('', {
              search: testName
            });
            if (data && data.length > 0) {
              oldFileName = data[0].name;
              break;
            }
          }
        }
      }
      
      // Get new file name - keep same name by default
      const keepSameName = true;
      const newFileName = keepSameName ? oldFileName : newImageFile.name;
      
      // Step 1: Delete the old file first (to avoid RLS issues with upsert)
      if (oldFileName) {
        const { error: deleteError } = await supabase.storage
          .from(bucketName)
          .remove([oldFileName]);
        
        // If delete fails, log but continue (file might not exist or already deleted)
        if (deleteError) {
          console.warn('Warning: Could not delete old file:', deleteError.message);
          // Continue anyway - we'll try to upload with the same name
        }
      }
      
      // Step 2: Upload the new file
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(newFileName, newImageFile, {
          contentType: newImageFile.type,
          upsert: false // Use false since we already deleted
        });
      
      if (uploadError) {
        // If upload fails and we deleted the old file, try with upsert
        if (oldFileName) {
          const { error: retryError } = await supabase.storage
            .from(bucketName)
            .upload(newFileName, newImageFile, {
              contentType: newImageFile.type,
              upsert: true
            });
          
          if (retryError) {
            throw retryError;
          }
        } else {
          throw uploadError;
        }
      }
      
      // Wait a moment for Supabase to process the change
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reload images from Supabase - this will refresh the list
      await loadSectionImages();
      
      // Force refresh by updating the specific image with cache-busting
      // Extract the base name without extension for matching
      const baseName = imageToChange.name.replace(/\.(jpg|jpeg|png|avif|webp)$/i, '');
      const timestamp = new Date().getTime();
      
      // Update the specific image's URL with cache-busting parameter
      setImages(prevImages => {
        const updatedImages = { ...prevImages };
        if (activeTab === 'jerseys') {
          updatedImages.jerseys = prevImages.jerseys.map(img => {
            const imgBaseName = img.name.replace(/\.(jpg|jpeg|png|avif|webp)$/i, '');
            if (imgBaseName === baseName || img.key === newFileName || img.key === oldFileName) {
              const newUrl = getJerseyImageUrl(newFileName);
              return { ...img, path: `${newUrl}?t=${timestamp}`, key: newFileName };
            }
            return img;
          });
        } else {
          updatedImages.faces = prevImages.faces.map(img => {
            const imgBaseName = img.name.replace(/\.(jpg|jpeg|png|avif|webp)$/i, '');
            if (imgBaseName === baseName || img.key === newFileName || img.key === oldFileName) {
              const newUrl = getFaceImageUrl(newFileName);
              return { ...img, path: `${newUrl}?t=${timestamp}`, key: newFileName };
            }
            return img;
          });
        }
        return updatedImages;
      });
      
      setNewImageFile(null);
      setNewImageName('');
      setImageToChange(null);
      setShowChangeModal(false);
      setUploading(false);
      
      alert('Image changed successfully in Supabase! Refresh the page if the image doesn\'t update immediately.');
    } catch (error) {
      console.error('Error changing image:', error);
      alert('Failed to change image: ' + error.message);
      setUploading(false);
    }
  };

  const handleDeleteImage = async (image) => {
    if (window.confirm(`Are you sure you want to delete ${image.name}?`)) {
      try {
        // Determine which Supabase bucket to delete from
        const bucketName = activeTab === 'jerseys' ? 'jerseys' : 'faces';
        
        // Find the file to delete - need to reconstruct the filename with extension
        let fileName = image.key || image.name;
        
        // Try different extensions if no extension found
        if (!fileName.includes('.')) {
          const possibleExtensions = ['.jpg', '.jpeg', '.png', '.avif'];
          // Try to find the actual file with extension
          const allImages = images[activeTab];
          const foundImage = allImages.find(img => img.name === image.name && img.key);
          if (foundImage && foundImage.key) {
            fileName = foundImage.key;
          } else {
            // Try common extensions
            for (const ext of possibleExtensions) {
              const { error } = await supabase.storage.from(bucketName).remove([image.name + ext]);
              if (!error) break;
            }
            alert('Image deleted successfully from Supabase!');
            await loadSectionImages();
            return;
          }
        }
        
        // Delete from Supabase Storage
        const { error } = await supabase.storage
          .from(bucketName)
          .remove([fileName]);
        
        if (error) {
          console.error('Error deleting image:', error);
          alert('Failed to delete image: ' + error.message);
          return;
        }
        
        alert('Image deleted successfully from Supabase!');
        
        // Reload images from Supabase
        await loadSectionImages();
      } catch (error) {
        console.error('Error deleting image:', error);
        alert('Failed to delete image: ' + error.message);
      }
    }
  };

  // Filter images based on search query
  const allImages = images[activeTab] || [];
  const currentImages = allImages.filter(image => 
    image.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Main Content */}
      <div className="admin-main">
        <div className="admin-header">
          <div className="admin-header-left">
            <h1>🛠️ Admin Panel</h1>
            <p>Face Swap Management</p>
          </div>
          <div className="admin-header-right">
            <span className="admin-welcome">Welcome, {localStorage.getItem('adminUsername') || 'Admin'}!</span>
            <button onClick={handleLogout} className="logout-button">
              🚪 Logout
            </button>
          </div>
        </div>

        <div className="admin-tabs">
          <button 
            className={`tab-button ${activeTab === 'jerseys' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('jerseys');
              setSearchQuery(''); // Clear search when switching tabs
            }}
          >
            👕 Jersey Images ({images.jerseys.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'faces' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('faces');
              setSearchQuery(''); // Clear search when switching tabs
            }}
          >
            👤 Face Images ({images.faces.length})
          </button>
        </div>

        <div className="admin-content">
          <div className="admin-actions">
            <div className="search-bar-container">
              <input
                type="text"
                placeholder={`🔍 Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="image-stats">
              <span>
                {searchQuery 
                  ? `Showing ${currentImages.length} of ${allImages.length} ${activeTab}` 
                  : `Total ${activeTab}: ${currentImages.length}`}
              </span>
            </div>
          </div>

          <div className="images-grid">
            {currentImages.length > 0 ? (
              currentImages.map((image, index) => (
                <div key={index} className="image-card">
                  <div className="image-preview">
                    <img 
                      src={image.path} 
                      alt={image.name}
                      onError={(e) => {
                        e.target.src = '/logo192.png'; // Fallback image
                      }}
                    />
                  </div>
                  <div className="image-info">
                    <h4>{image.name}</h4>
                  </div>
                  <div className="image-actions">
                    <button 
                      onClick={() => setSelectedImage(image)}
                      className="view-button"
                    >
                      👁️ View
                    </button>
                    <button 
                      onClick={() => {
                        setImageToChange(image);
                        setNewImageFile(null);
                        setNewImageName(image.name);
                        setShowChangeModal(true);
                      }}
                      className="change-button"
                    >
                      ✏️ Change
                    </button>
                    <button 
                      onClick={() => handleDeleteImage(image)}
                      className="delete-button"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-images">
                {searchQuery ? (
                  <>
                    <p>No {activeTab} found matching "{searchQuery}"</p>
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="upload-first-button"
                    >
                      Clear Search
                    </button>
                  </>
                ) : (
                  <>
                    <p>No {activeTab} images found</p>
                    <button 
                      onClick={() => setShowUploadModal(true)}
                      className="upload-first-button"
                    >
                      📤 Upload First Image
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>📤 Upload New {activeTab.slice(0, -1)} Image</h3>
            <p>Section: <strong>{selectedSection}</strong></p>
            
            <div className="upload-form">
              <div className="form-group">
                <label>Select Image File:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
              
              <div className="form-group">
                <label>Image Name:</label>
                <input
                  type="text"
                  value={newImageName}
                  onChange={(e) => setNewImageName(e.target.value)}
                  placeholder="Enter image name (e.g., Team Name)"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => setShowUploadModal(false)}
                className="cancel-button"
                disabled={uploading}
              >
                Cancel
              </button>
              <button 
                onClick={handleUploadImage}
                className="confirm-button"
                disabled={!newImageFile || !newImageName || uploading}
              >
                {uploading ? (
                  <>
                    <span className="spinner"></span>
                    Uploading...
                  </>
                ) : (
                  'Upload Image'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Image Modal */}
      {showChangeModal && imageToChange && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>✏️ Change Image: {imageToChange.name}</h3>
            
            <div className="upload-form">
              <div className="form-group">
                <label>Select New Image File:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setNewImageFile(file);
                    }
                  }}
                />
                {newImageFile && (
                  <div style={{ marginTop: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '5px' }}>
                    <p style={{ margin: 0 }}>Selected: <strong>{newImageFile.name}</strong></p>
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label>Image Name:</label>
                <input
                  type="text"
                  value={newImageName}
                  onChange={(e) => setNewImageName(e.target.value)}
                  placeholder="Enter image name (e.g., Team Name)"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => {
                  setShowChangeModal(false);
                  setImageToChange(null);
                  setNewImageFile(null);
                  setNewImageName('');
                }}
                className="cancel-button"
                disabled={uploading}
              >
                Cancel
              </button>
              <button 
                onClick={handleChangeImage}
                className="confirm-button"
                disabled={!newImageFile || uploading}
              >
                {uploading ? (
                  <>
                    <span className="spinner"></span>
                    Changing...
                  </>
                ) : (
                  'Change Image'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image View Modal */}
      {selectedImage && (
        <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="modal-content image-view-modal" onClick={(e) => e.stopPropagation()}>
            <h3 onClick={() => setSelectedImage(null)} style={{cursor: 'pointer'}}>
              {selectedImage.name}
            </h3>
            <img src={selectedImage.path} alt={selectedImage.name} />
            <div className="image-info">
              <p><strong>Team:</strong> {selectedImage.name}</p>
              <p><strong>Type:</strong> {selectedImage.type === 'jersey' ? 'Jersey Image' : 'Face Image'}</p>
              <div className="image-path">
                📁 {selectedImage.path}
              </div>
            </div>
            <button 
              onClick={() => setSelectedImage(null)}
              className="close-button"
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
