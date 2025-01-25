// tests/services/topicService.test.js
const { describe, it, beforeEach, afterEach } = require('jest');
const TopicService = require('../src/services/topicService');
const RatingService = require('../src/services/ratingService');
const supabase = require('../src/config/supabase');

describe('Topic Service Tests', () => {
    // Sample test data
    const testHouse = {
        id: 'house-uuid',
        name: 'Test House',
        address: '123 Test St'
    };

    const testUsers = [
        { id: 'user1-uuid', name: 'User 1', type: 'tenant' },
        { id: 'user2-uuid', name: 'User 2', type: 'tenant' },
        { id: 'user3-uuid', name: 'User 3', type: 'maintainer' }
    ];

    // Test Topic Creation
    describe('Topic Creation', () => {
        it('should create a conflict topic successfully', async () => {
            const topicData = {
                house_id: testHouse.id,
                created_by: testUsers[0].id,
                created_for: [testUsers[1].id],
                type: 'conflict',
                description: 'Noise complaint test',
                rating_parameter: 'rp2' // Behavior parameter
            };

            const topic = await TopicService.createTopic(topicData, testUsers[0].id);
            expect(topic).toBeDefined();
            expect(topic.type).toBe('conflict');
            expect(topic.status).toBe('active');
        });

        it('should create a mentions topic successfully', async () => {
            const topicData = {
                house_id: testHouse.id,
                created_by: testUsers[0].id,
                created_for: [testUsers[1].id],
                type: 'mentions',
                description: 'Good cleaning habits',
                rating_parameter: 'rp1' // Cleanliness parameter
            };

            const topic = await TopicService.createTopic(topicData, testUsers[0].id);
            expect(topic).toBeDefined();
            expect(topic.type).toBe('mentions');
        });

        it('should prevent creating topic with invalid rating parameter', async () => {
            const topicData = {
                house_id: testHouse.id,
                created_by: testUsers[0].id,
                created_for: [testUsers[1].id],
                type: 'conflict',
                description: 'Test',
                rating_parameter: 'invalid_param'
            };

            await expect(TopicService.createTopic(topicData, testUsers[0].id))
                .rejects.toThrow();
        });
    });

    // Test Topic Processing
    describe('Topic Processing', () => {
        it('should process old conflict topics and update ratings', async () => {
            // Create a topic that's 31 days old
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 31);

            const topicData = {
                house_id: testHouse.id,
                created_by: testUsers[0].id,
                created_for: [testUsers[1].id],
                type: 'conflict',
                description: 'Old conflict',
                rating_parameter: 'rp2',
                created_at: oldDate
            };

            await TopicService.createTopic(topicData, testUsers[0].id);
            await RatingService.processTopicRatings();

            // Check if rating was updated
            const { data: userRating } = await supabase
                .from('user_ratings')
                .select('rp2')
                .eq('user_id', testUsers[1].id)
                .single();

            expect(userRating.rp2).toBeLessThan(700); // Should be reduced by 50
        });

        it('should process old mentions topics and update ratings', async () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 31);

            const topicData = {
                house_id: testHouse.id,
                created_by: testUsers[0].id,
                created_for: [testUsers[1].id],
                type: 'mentions',
                description: 'Old mention',
                rating_parameter: 'rp1',
                created_at: oldDate
            };

            await TopicService.createTopic(topicData, testUsers[0].id);
            await RatingService.processTopicRatings();

            // Check if rating was updated
            const { data: userRating } = await supabase
                .from('user_ratings')
                .select('rp1')
                .eq('user_id', testUsers[1].id)
                .single();

            expect(userRating.rp1).toBeGreaterThan(700); // Should be increased by 10
        });
    });

    // Test Topic Archival
    describe('Topic Archival', () => {
        it('should archive old topics', async () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 31);

            const topicData = {
                house_id: testHouse.id,
                created_by: testUsers[0].id,
                type: 'general',
                description: 'Old general topic',
                created_at: oldDate
            };

            const topic = await TopicService.createTopic(topicData, testUsers[0].id);
            await RatingService.processTopicRatings();

            const { data: archivedTopic } = await supabase
                .from('topics')
                .select('status')
                .eq('id', topic.id)
                .single();

            expect(archivedTopic.status).toBe('archived');
        });
    });
});

// tests/services/ratingService.test.js
describe('Rating Service Tests', () => {
    describe('Rating Calculations', () => {
        it('should apply conflict penalty correctly', async () => {
            const userId = testUsers[1].id;
            const initialRating = 700;
            
            // Set initial rating
            await supabase
                .from('user_ratings')
                .update({ rp2: initialRating })
                .eq('user_id', userId);

            // Create and process conflict topic
            const topicData = {
                house_id: testHouse.id,
                created_by: testUsers[0].id,
                created_for: [userId],
                type: 'conflict',
                description: 'Conflict test',
                rating_parameter: 'rp2'
            };

            await TopicService.createTopic(topicData, testUsers[0].id);
            await RatingService.processTopicRatings();

            // Check final rating
            const { data: rating } = await supabase
                .from('user_ratings')
                .select('rp2')
                .eq('user_id', userId)
                .single();

            expect(rating.rp2).toBe(initialRating - 50);
        });

        it('should apply mentions reward correctly', async () => {
            const userId = testUsers[1].id;
            const initialRating = 700;
            
            // Set initial rating
            await supabase
                .from('user_ratings')
                .update({ rp1: initialRating })
                .eq('user_id', userId);

            // Create and process mentions topic
            const topicData = {
                house_id: testHouse.id,
                created_by: testUsers[0].id,
                created_for: [userId],
                type: 'mentions',
                description: 'Mentions test',
                rating_parameter: 'rp1'
            };

            await TopicService.createTopic(topicData, testUsers[0].id);
            await RatingService.processTopicRatings();

            // Check final rating
            const { data: rating } = await supabase
                .from('user_ratings')
                .select('rp1')
                .eq('user_id', userId)
                .single();

            expect(rating.rp1).toBe(initialRating + 10);
        });
    });

    describe('Rating Boundaries', () => {
        it('should not exceed maximum rating', async () => {
            const userId = testUsers[1].id;
            const maxRating = 1000;
            
            // Set initial rating near max
            await supabase
                .from('user_ratings')
                .update({ rp1: maxRating - 5 })
                .eq('user_id', userId);

            // Create and process mentions topic
            const topicData = {
                house_id: testHouse.id,
                created_by: testUsers[0].id,
                created_for: [userId],
                type: 'mentions',
                description: 'Max rating test',
                rating_parameter: 'rp1'
            };

            await TopicService.createTopic(topicData, testUsers[0].id);
            await RatingService.processTopicRatings();

            // Check final rating
            const { data: rating } = await supabase
                .from('user_ratings')
                .select('rp1')
                .eq('user_id', userId)
                .single();

            expect(rating.rp1).toBe(maxRating);
        });

        it('should not go below minimum rating', async () => {
            const userId = testUsers[1].id;
            const minRating = 0;
            
            // Set initial rating near min
            await supabase
                .from('user_ratings')
                .update({ rp2: 40 })
                .eq('user_id', userId);

            // Create and process conflict topic
            const topicData = {
                house_id: testHouse.id,
                created_by: testUsers[0].id,
                created_for: [userId],
                type: 'conflict',
                description: 'Min rating test',
                rating_parameter: 'rp2'
            };

            await TopicService.createTopic(topicData, testUsers[0].id);
            await RatingService.processTopicRatings();

            // Check final rating
            const { data: rating } = await supabase
                .from('user_ratings')
                .select('rp2')
                .eq('user_id', userId)
                .single();

            expect(rating.rp2).toBe(minRating);
        });
    });
});