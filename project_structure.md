.
├── logs
│   ├── combined.log
│   └── error.log
├── package-lock.json
├── package.json
├── project_structure.md
├── scripts
│   ├── load-env.sh
│   └── schemas_supabase
│       ├── Add the status column to the topics table.sql
│       ├── Process Topic Rating Updates
│       ├── Remove Password Column from Users Table.sql
│       ├── Supabase Snippet Column Information Retrieval.csv
│       ├── Topics and Votes Management.sql
│       ├── User Rating Management.sql
│       └── schema_supabase.sql
├── src
│   ├── config
│   │   ├── constants.js
│   │   ├── env-check.js
│   │   ├── logger.js
│   │   ├── ratingConstants.js
│   │   ├── s3.js
│   │   └── supabase.js
│   ├── controllers
│   │   ├── authController.js
│   │   ├── houseController.js
│   │   ├── imageController.js
│   │   ├── ratingController.js
│   │   ├── timeBlockController.js
│   │   ├── topicController.js
│   │   └── userController.js
│   ├── cornJobs.js
│   ├── middleware
│   │   ├── auth
│   │   │   └── authenticate.js
│   │   ├── errorHandler.js
│   │   └── validators
│   │       ├── houseValidator.js
│   │       ├── ratingValidator.js
│   │       ├── topicValidator.js
│   │       ├── userValidator.js
│   │       └── validator.js
│   ├── routes
│   │   ├── auth.routes.js
│   │   ├── house.routes.js
│   │   ├── image.routes.js
│   │   ├── index.js
│   │   ├── rating.routes.js
│   │   ├── timeBlock.routes.js
│   │   ├── topic.routes.js
│   │   └── user.routes.js
│   ├── scripts
│   │   └── ratingScheduler.js
│   ├── server.js
│   ├── services
│   │   ├── emailService.js
│   │   ├── houseService.js
│   │   ├── notificationService.js
│   │   ├── ratingService.js
│   │   ├── s3Service.js
│   │   ├── schedulerService.js
│   │   ├── timeBlockService.js
│   │   ├── topicRatingService.js
│   │   ├── topicService.js
│   │   ├── topicService2.js
│   │   └── userService.js
│   └── utils
│       ├── AppError.js
│       └── response.js
└── tests
    ├── api.test.js
    ├── functions.md
    ├── genrateTestData.js
    ├── testing_checklist.md
    └── topicService.test.js

15 directories, 62 files
