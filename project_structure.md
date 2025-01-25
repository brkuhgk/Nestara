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
│   │   └── supabase.js
│   ├── controllers
│   │   ├── authController.js
│   │   ├── houseController.js
│   │   ├── topicController.js
│   │   └── userController.js
│   ├── middleware
│   │   ├── auth
│   │   │   └── authenticate.js
│   │   ├── errorHandler.js
│   │   └── validators
│   │       ├── houseValidator.js
│   │       ├── userValidator.js
│   │       └── validator.js
│   ├── routes
│   │   ├── auth.routes.js
│   │   ├── house.routes.js
│   │   ├── index.js
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
    ├── testing_checklist.md
    └── topicService.test.js

15 directories, 48 files
