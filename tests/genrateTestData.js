const supabase = require('../config/supabase');
const { DEFAULT_RATING } = require('../config/constants');

async function generateTestData() {
  // Create test users
  const users = [
    {
      email: 'tenant1@test.com',
      password: 'test123',
      name: 'Tenant One',
      phone: '+1234567890',
      type: 'tenant',
      username: 'tenant1'
    },
    {
      email: 'tenant2@test.com',
      password: 'test123',
      name: 'Tenant Two',
      phone: '+1234567891',
      type: 'tenant',
      username: 'tenant2'
    },
    {
      email: 'maintainer@test.com',
      password: 'test123',
      name: 'Maintainer One',
      phone: '+1234567892',
      type: 'maintainer',
      username: 'maintainer1'
    }
  ];

  const createdUsers = [];
  for (const user of users) {
    // Create auth user
    const { data: authData } = await supabase.auth.signUp({
      email: user.email,
      password: user.password
    });

    // Create user profile
    const { data: userData } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        ...user
      })
      .single();

    createdUsers.push(userData);

    // Initialize ratings
    await supabase
      .from('user_ratings')
      .insert({
        user_id: userData.id,
        rp1: DEFAULT_RATING,
        rp2: DEFAULT_RATING,
        rp3: DEFAULT_RATING,
        rp4: DEFAULT_RATING,
        rp5: DEFAULT_RATING,
        mp1: DEFAULT_RATING,
        mp2: DEFAULT_RATING,
        mp3: DEFAULT_RATING
      });
  }

  // Create test houses
  const houses = [
    {
      name: 'Test House 1',
      address: '123 Test Street',
      image_url: null
    },
    {
      name: 'Test House 2',
      address: '456 Test Avenue',
      image_url: null
    }
  ];

  const createdHouses = [];
  for (const house of houses) {
    const { data: houseData } = await supabase
      .from('houses')
      .insert(house)
      .single();
    createdHouses.push(houseData);
  }

  // Add house members
  const houseMembers = [
    {
      house_id: createdHouses[0].id,
      user_id: createdUsers[0].id,
      type: 'tenant',
      status: 'active'
    },
    {
      house_id: createdHouses[0].id,
      user_id: createdUsers[1].id,
      type: 'tenant',
      status: 'active'
    },
    {
      house_id: createdHouses[0].id,
      user_id: createdUsers[2].id,
      type: 'maintainer',
      status: 'active'
    },
    {
      house_id: createdHouses[1].id,
      user_id: createdUsers[0].id,
      type: 'tenant',
      status: 'active'
    }
  ];

  await supabase.from('house_members').insert(houseMembers);

  // Generate some rating history
  const ratingHistory = [
    {
      user_id: createdUsers[0].id,
      old_values: { rp1: DEFAULT_RATING },
      new_values: { rp1: DEFAULT_RATING - 50 },
      reason: 'Conflict topic penalty'
    },
    {
      user_id: createdUsers[1].id,
      old_values: { rp2: DEFAULT_RATING },
      new_values: { rp2: DEFAULT_RATING + 50 },
      reason: 'Mentions topic reward'
    }
  ];

  await supabase.from('rating_history').insert(ratingHistory);

  return {
    users: createdUsers,
    houses: createdHouses
  };
}

// Usage example
generateTestData()
  .then(results => console.log('Test data generated:', results))
  .catch(error => console.error('Error generating test data:', error));