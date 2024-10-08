/* The maximum number of minutes in a period (a day) */

const MAX_IN_PERIOD = 1440;
const STATE_ON = "on";
const STATE_OFF = "off";
const STATE_AUTO_OFF = "auto-off";

/**
 * PART 1
 *
 * You have an appliance that uses energy, and you want to calculate how
 * much energy it uses over a period of time.
 *
 * As an input to your calculations, you have a series of events that contain
 * a timestamp and the new state (on or off). You are also given the initial
 * state of the appliance. From this information, you will need to calculate
 * the energy use of the appliance i.e. the amount of time it is switched on.
 *
 * The amount of energy it uses is measured in 1-minute intervals over the
 * period of a day. Given there is 1440 minutes in a day (24 * 60), if the
 * appliance was switched on the entire time, its energy usage would be 1440.
 * To simplify calculations, timestamps range from 0 (beginning of the day)
 * to 1439 (last minute of the day).
 *
 * HINT: there is an additional complication with the last two tests that
 * introduce spurious state change events (duplicates at different time periods).
 * Focus on getting these tests working after satisfying the first tests.
 *
 * The structure for `profile` looks like this (as an example):
 * ```
 * {
 *    initial: 'on',
 *    events: [
 *      { state: 'off', timestamp: 50 },
 *      { state: 'on', timestamp: 304 },
 *      { state: 'off', timestamp: 600 },
 *    ]
 * }
 * ```
 */

const calculateEnergyUsageSimple = (profile) => {
  let totalEnergyUsage = 0;
  let currentState = profile.initial;
  let previousTimestamp = 0;

  profile.events.forEach((powerEvent) => {
    // if we're trying to handle the same power state twice in a row we can skip it
    if (currentState === powerEvent.state) {
      return;
    }

    if (currentState === STATE_ON) {
      totalEnergyUsage += powerEvent.timestamp - previousTimestamp;
    }

    currentState = powerEvent.state;
    previousTimestamp = powerEvent.timestamp;
  });

  // if the appliance is still on after the last state change event we need to add the remaining time
  if (currentState === STATE_ON) {
    totalEnergyUsage += MAX_IN_PERIOD - previousTimestamp;
  }

  return totalEnergyUsage;
};

/**
 * PART 2
 *
 * You purchase an energy-saving device for your appliance in order
 * to cut back on its energy usage. The device is smart enough to shut
 * off the appliance after it detects some period of disuse, but you
 * can still switch on or off the appliance as needed.
 *
 * You are keen to find out if your shiny new device was a worthwhile
 * purchase. Its success is measured by calculating the amount of
 * energy *saved* by device.
 *
 * To assist you, you now have a new event type that indicates
 * when the appliance was switched off by the device (as opposed to switched
 * off manually). Your new states are:
 * * 'on'
 * * 'off' (manual switch off)
 * * 'auto-off' (device automatic switch off)
 *
 * (The `profile` structure is the same, except for the new possible
 * value for `initial` and `state`.)
 *
 * Write a function that calculates the *energy savings* due to the
 * periods of time when the device switched off your appliance. You
 * should not include energy saved due to manual switch offs.
 *
 * You will need to account for redundant/non-sensical events e.g.
 * an off event after an auto-off event, which should still count as
 * an energy savings because the original trigger was the device
 * and not manual intervention.
 */

const calculateEnergySavings = (profile) => {
  let totalEnergySavings = 0;
  let currentState = profile.initial;
  let previousTimestamp = 0;

  profile.events.forEach((powerEvent) => {
    // if we're trying to handle the same power state twice in a row we can skip it
    if (currentState === powerEvent.state) {
      return;
    }

    // if the last recorded state was auto-off and the current state is off, we can skip it
    if (currentState === STATE_AUTO_OFF && powerEvent.state === STATE_OFF) {
      return;
    }

    if (currentState === STATE_AUTO_OFF && powerEvent.state === STATE_ON) {
      totalEnergySavings += powerEvent.timestamp - previousTimestamp;
    }

    currentState = powerEvent.state;
    previousTimestamp = powerEvent.timestamp;
  });

  // If last recorded state was auto-off, add the rest of the time in the day to energy saved
  if (currentState === STATE_AUTO_OFF) {
    totalEnergySavings += MAX_IN_PERIOD - previousTimestamp;
  }

  return totalEnergySavings;
};

/**
 * PART 3
 *
 * The process of producing metrics usually requires handling multiple days of data. The
 * examples so far have produced a calculation assuming the day starts at '0' for a single day.
 *
 * In this exercise, the timestamp field contains the number of minutes since a
 * arbitrary point in time (the "Epoch"). To simplify calculations, assume:
 *  - the Epoch starts at the beginning of the month (i.e. midnight on day 1 is timestamp 0)
 *  - our calendar simply has uniform length 'days' - the first day is '1' and the last day is '365'
 *  - the usage profile data will not extend more than one month
 *
 * Your function should calculate the energy usage over a particular day, given that
 * day's number. It will have access to the usage profile over the month.
 *
 * It should also throw an error if the day value is invalid i.e. if it is out of range
 * or not an integer. Specific error messages are expected - see the tests for details.
 *
 * (The `profile` structure is the same as part 1, but remember that timestamps now extend
 * over multiple days)
 *
 * HINT: You are encouraged to re-use `calculateEnergyUsageSimple` from PART 1 by
 * constructing a usage profile for that day by slicing up and rewriting up the usage profile you have
 * been given for the month.
 */

const isInteger = (number) => Number.isInteger(number);

const calculateEnergyUsageForDay = (monthUsageProfile, day) => {
  // validation
  validateDay(day);

  // get energy profile for day
  const profile = getEnergyUsageProfileForDay(monthUsageProfile, day);

  return calculateEnergyUsageSimple(profile);
};

const validateDay = (day) => {
  if (!isInteger(day)) {
    throw new Error(`Day ${day} must be an integer`);
  }

  if (day < 1 || day > 365) {
    throw new Error(`${day} day out of range`);
  }
};

const getEnergyUsageProfileForDay = (monthUsageProfile, day) => {
  // skeleton profile with energy events for day
  const profile = {
    initial: null,
    events: getEnergyEventsForDay(monthUsageProfile, day),
  };

  // traverse back through previous days to get initial state
  let previousDay = day - 1;
  while (profile.initial === null && previousDay > 0) {
    const events = getEnergyEventsForDay(monthUsageProfile, previousDay);

    if (events.length) {
      profile.initial = events[events.length - 1]?.state;
    }

    previousDay--;
  }

  // if no initial state, set to month's initial state
  if (profile.initial === null) {
    profile.initial = monthUsageProfile.initial;
  }

  return profile;
};

const getEnergyEventsForDay = (monthUsageProfile, day) => {
  const dayTimestampStart = (day - 1) * MAX_IN_PERIOD;
  const dayTimestampEnd = dayTimestampStart + MAX_IN_PERIOD - 1;

  // fetch events for day (between min/max timestamps)
  const events = monthUsageProfile.events.filter((event) => {
    return (
      event.timestamp >= dayTimestampStart && event.timestamp <= dayTimestampEnd
    );
  });

  // convert original timestamp to day timestamp (timestamp % MAX_IN_PERIOD)
  return events.map((event) => {
    return {
      state: event.state,
      timestamp: event.timestamp % MAX_IN_PERIOD,
    };
  });
};

module.exports = {
  calculateEnergyUsageSimple,
  calculateEnergySavings,
  calculateEnergyUsageForDay,
  MAX_IN_PERIOD,
};
