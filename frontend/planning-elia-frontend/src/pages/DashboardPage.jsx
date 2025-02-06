// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

function DashboardPage() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Appel au backend pour récupérer le planning
    fetch('/api/planning') // Remplace cette URL par la bonne URL de ton API
      .then((res) => res.json())
      .then((data) => {
        // Transformation des données pour react-big-calendar
        const formattedEvents = data.map((item) => ({
          title: `${item.technicien} - ${item.zone}`,
          start: new Date(item.dateStart),
          end: new Date(item.dateEnd),
        }));
        setEvents(formattedEvents);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="dashboard">
      <h2>Planning des Gardes</h2>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
      />
    </div>
  );
}

export default DashboardPage;
