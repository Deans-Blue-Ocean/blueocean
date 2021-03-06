const { Pool } = require("pg");
const assessmentRouter = require("../server/routes/assessments");

connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  max: 90,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

pool.on('connect', () => console.log('database connected'))

/*=================================================================
======================                  ===========================
=====================   INSERT QUERIES   ==========================
======================                  ===========================
===================================================================
*/
// inputs (user < {{ name, email, title, aboutMe, location, linkedinUrl }, cb (err, results) => {})
const insertUser = (user, cb) => {
  let {
    name,
    email,
    title,
    aboutMe,
    location,
    linkedinUrl,
    password,
    token,
  } = user;
  pool.query(
    `
    INSERT INTO users
    (name, email, title, about_me, location, linkedin_url, password, token)
    VALUES
    (
        '${name}',
        '${email}',
        '${title}',
        '${aboutMe}',
        '${location}',
        '${linkedinUrl}',
        '${password}'
        '${token}'
    )
    RETURNING *`,
    (err, results) => {
      if (err) {
        cb(err, null);
      } else {
        cb(null, results.rows);
      }
    }
  );
};

// inputs (event < {name, location, date, hostId, meetingUrl, summary, max} >, cb (err, results) => {} )
const insertEvent = (event, cb) => {
  let { name, location, date, hostId, meetingUrl, summary, max } = event;
  pool.query(
    `INSERT INTO events (event_name, location, date, host_id, meeting_url, summary, attendee_max) VALUES
    (
        '${name}',
        '${location}',
        '${date}',
        '${hostId}',
        '${meetingUrl}',
        '${summary}',
        ${max}
    )
    RETURNING *`,
    (err, results) => {
      if (err) {
        cb(err, null);
      } else {
        cb(null, results);
      }
    }
  );
};

const insertEventPhoto = (eventId, url, cb) => {
  pool.query(
    `
  INSERT INTO event_photos
  (event_id, image)
  VALUES
  (${eventId},
  '${url}'
  )`,
    (err, results) => {
      if (err) {
        cb(err, null);
      } else {
        cb(null, results);
      }
    }
  );
};
// inputs (userId <number>, eventId <number>, cb (err, results) => {})
const makeUserAnAttendee = (userId, eventId, cb) => {
  pool.query(
    `INSERT INTO attendees (user_id, event_id) VALUES (${userId}, ${eventId})`,
    (err, results) => {
      if (err) {
        cb(err, null);
      } else {
        cb(null, results);
      }
    }
  );
};

const removeAttendee = (userId, eventId, cb) => {
  pool.query(
    `DELETE FROM attendees WHERE event_id = ${eventId} AND user_id = ${userId}`,
    (err, results) => {
      if (err) {
        cb(err, null);
      } else {
        cb(null, results);
      }
    }
  )
}

// inputs (eventId <number>, questions <[{text: "question text here?", answers: [{text: "answer text here.", correct: true/false }, {}] }]>, cb (err, results) =>{})
const insertAssessment = (eventId, questions, cb) => {
  pool.query(
    `INSERT INTO assessments (event_id) VALUES (${eventId}) RETURNING assessment_id`,
    (err, results) => {
      if (err) {
        console.log(err);
        cb(err, null);
      } else {
        let assessmentId = results.rows[0].assessment_id;
          pool.query(
            `INSERT INTO questions (assessment_id, question_text) VALUES (${assessmentId}, '${questions.text}') RETURNING question_id`,
            (err, results) => {
              var valueString = ''
              if (err) {
                console.log(err);
                cb(err, null);
              } else {
                
                questionId = results.rows[0].question_id
                  questions.answers.forEach((answer) => {
                    valueString +=
                      ", (" +
                      questionId +
                      ", '" +
                      answer.text +
                      "', " +
                      answer.correct +
                      ") ";
                  });
                };
                valueString = valueString.slice(3);
                if (valueString !== "") {
                  pool.query(
                    `INSERT INTO answers (question_id, answer_text, correct) VALUES (${valueString}`,
                    (err, results) => {
                      if (err) {
                        console.log(err);
                        cb(err, null);
                      }
                    }
                  );
                } 
              }
          );
        }
        cb(null, results);
      }// good
  );
};

/*=================================================================
======================                  ===========================
=====================   SELECT QUERIES   ==========================
======================                  ===========================
===================================================================
*/

const getAllUpcomingEvents = (cb) => {
  pool.query(
    `
  SELECT *
  FROM events
  LEFT OUTER JOIN event_photos ON events.event_id = event_photos.event_id
  WHERE date > NOW()
  GROUP BY events.event_id, event_photos.photo_id
  ORDER BY date ASC
  `,
    (err, results) => {
      if (err) {
        cb(err, null);
      } else {
        cb(null, results.rows);
      }
    }
  );
};

const getEventsByAttendee = (userId, cb) => {
  pool.query(
    `SELECT
    *
    FROM events
    LEFT OUTER JOIN attendees ON events.event_id = attendees.event_id
    RIGHT OUTER JOIN event_photos ON events.event_id = event_photos.event_id
    WHERE date > NOW()
    AND user_id = ${userId}
    ORDER BY date ASC`,
    (err, results) => {
      if (err) {
        cb(err, null);
      } else {
        cb(null, results.rows);
      }
    }
  );
};

const getEventsByHost = (userId, cb) => {
  pool.query(
    `
    SELECT *
    FROM events
    LEFT OUTER JOIN users ON events.host_id = users.id
    RIGHT OUTER JOIN event_photos ON events.event_id = event_photos.event_id
    WHERE date > NOW()
    AND id = ${userId}
    ORDER BY date ASC`,
    (err, results) => {
      if (err) {
        cb(err, null);
      } else {
        cb(null, results.rows);
      }
    }
  );
};

const getAllUsers = (cb) => {
  pool.query(`SELECT * FROM users`, (err, results) => {
    if (err) {
      cb(err, null);
    } else {
      cb(null, results.rows);
    }
  });
};

const getAttendeesByEvent = (eventId, cb) => {
  pool.query(
    `
    SELECT *
    FROM users
    LEFT OUTER JOIN attendees ON users.id = attendees.user_id
    WHERE event_id = ${eventId}`,
    (err, results) => {
      if (err) {
        cb(err, null);
      } else {
        cb(null, results.rows);
      }
    }
  );
};

const getAssessmentQuestionsByEvent = (eventId, cb) => {
  pool.query(
    `
    SELECT
    assessments.assessment_id,
    assessments.event_id,
    jsonb_agg(jsonb_build_object(
        'id', questions.question_id,
        'question', questions.question_text
    )) AS questions
    FROM assessments
    LEFT OUTER JOIN questions ON assessments.assessment_id = questions.assessment_id
    WHERE assessments.event_id = ${eventId}
    GROUP BY assessments.assessment_id
    `,
    (err, results) => {
      if (err) {
        cb(err, null);
      } else {
        cb(null, results.rows);
      }
    }
  );
};

const getAnswersByQuestion = (questionId, cb) => {
  pool.query(
    `
  SELECT *
  FROM answers
  WHERE answers.question_id = ${questionId}
  `,
    (err, results) => {
      if (err) {
        cb(err, null);
      } else {
        cb(null, results.rows);
      }
    }
  );
};

const getEventPhotos = (eventId, cb) => {
  pool.query(
    `
  SELECT *
  FROM event_photos
  WHERE event_id = ${eventId}
  `,
    (err, results) => {
      if (err) {
        cb(err, null);
      } else {
        cb(null, results.rows);
      }
    }
  );
};

/*=================================================================
======================                  ===========================
===================   UserProfileQueries   ========================
======================                  ===========================
===================================================================
*/

// First param must be an object with an 'id' key corresponding to user.
// optional keys include title, aboutMe, location, linkedinUrl, image, password
// any keys present in updateInfo will be changed, any excluded will remain the same

const updateUserProfile = (updateInfo, cb) => {
  let updateString = "";
  if (updateInfo.title) {
    updateString += ` title = '${updateInfo.title}', `;
  }
  if (updateInfo.aboutMe) {
    updateString += ` about_me = '${updateInfo.aboutMe}', `;
  }
  if (updateInfo.location) {
    updateString += ` location = '${updateInfo.location}', `;
  }
  if (updateInfo.linkedinUrl) {
    updateString += ` linkedin_url = '${updateInfo.linkedinUrl}', `;
  }
  if (updateInfo.password) {
    updateString += ` password = '${updateInfo.password}', `;
  }
  if (updateInfo.image) {
    updateString += ` image = '${updateInfo.image}', `;
  }
  updateString = updateString.slice(0, -2);

  pool.query(
    `
  UPDATE users
  SET ${updateString}
  WHERE id = ${updateInfo.id}
  RETURNING *
  `,
    (err, results) => {
      if (err) {
        cb(err, null);
      } else {
        cb(null, results);
      }
    }
  );
};

const getUserProfileByEmail = (email, cb) => {
  pool.query(
    `
  SELECT *
  FROM users
  WHERE email = '${email}'`,
    (err, results) => {
      if (err) {
        cb(err, null);
      } else {
        cb(null, results.rows);
      }
    }
  );
};



module.exports = {
  insertUser,
  insertEvent,
  makeUserAnAttendee,
  insertAssessment,
  insertEventPhoto,
  getAllUpcomingEvents,
  getEventsByAttendee,
  getEventsByHost,
  getAllUsers,
  getAttendeesByEvent,
  getAssessmentQuestionsByEvent,
  getAnswersByQuestion,
  getEventPhotos,
  getUserProfileByEmail,
  updateUserProfile,
  removeAttendee
};
