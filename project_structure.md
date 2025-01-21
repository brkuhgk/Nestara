.
├── logs
│   ├── combined.log
│   └── error.log
├── package-lock.json
├── package.json
├── project_structure.md
├── scripts
│   ├── load-env.sh
│   └── schema_supabase.md
├── src
│   ├── config
│   │   ├── constants.js
│   │   ├── env-check.js
│   │   ├── logger.js
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
│   ├── server.js
│   ├── services
│   │   ├── emailService.js
│   │   ├── houseService.js
│   │   ├── notificationService.js
│   │   ├── ratingService.js
│   │   ├── timeBlockService.js
│   │   ├── topicService.js
│   │   └── userService.js
│   └── utils
│       ├── AppError.js
│       └── response.js
└── tests
    └── api.test.js

13 directories, 36 files
