import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SidebarEventCard from './SidebarEventCard';

const requests = require("../../handlers/requests");

const ComingUp = ({ userId }) => {
  const [upcomingEvents, setUpcomingEvents] = useState(null);

  const getUpcomingEvents = () => {
    const options = {
      url: `http://localhost:4000/user/${userId}`,
      method: 'get'
    };

    if (userId) {
      axios(options)
      .then((results) => {
        setUpcomingEvents(results.data);
      })
      .catch((error) => {
        console.log(error);
      })
    }
  };

  useEffect(() => {
    getUpcomingEvents();
  }, [userId])

  return (
    <div>
      {upcomingEvents ? upcomingEvents.map((event, i) => (
        <SidebarEventCard
          key={i}
          name={event.event_name}
          location={event.location}
          date={event.date}
          eventId={event.event_id}
          userId={userId}
        />
      )) : null}

    </div>
  );
};

export default ComingUp;