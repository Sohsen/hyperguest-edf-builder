import { ARIData, ARIFullDetails, DailyRatePlanARI } from '../types';
import { ARI_SOURCE } from '../data/ariSource';

export const parseARISource = () => {
  const ariMap: Record<string, Record<string, Record<string, Record<string, ARIData[]>>>> = {};
  let totalRows = 0;
  let uniqueRooms = new Set<string>();

  ARI_SOURCE.hotels.forEach(hotel => {
    const hgId = hotel.hgHotelId;
    ariMap[hgId] = {};

    hotel.rooms.forEach(room => {
      const roomCode = room.roomCode;
      ariMap[hgId][roomCode] = {};
      uniqueRooms.add(`${hgId}-${roomCode}`);

      room.rateplans.forEach(rp => {
        const mealPlan = rp.mealplanCode;
        ariMap[hgId][roomCode][mealPlan] = {};

        //rp.ari is ARIFullDetails[]
        rp.ari.forEach((day: ARIFullDetails) => {
          if (!day.ratePlans) return;

          day.ratePlans.forEach((ratePlan) => {
            // Check if it's DailyRatePlanARI
            const daily = ratePlan as DailyRatePlanARI;
            if (!daily.baseAmounts) return;

            daily.baseAmounts.forEach(ba => {
              const adults = ba.numberOfGuests?.adults || 0;
              const children = ba.numberOfGuests?.children || 0;
              const infant = ba.numberOfGuests?.infants || 0;
              
              // Map to a string code e.g. "2A1C"
              let occCode = `${adults}A`;
              if (children > 0) occCode += `${children}C`;
              if (infant > 1) occCode += `${infant}I`; 

              if (!ariMap[hgId][roomCode][mealPlan][occCode]) {
                ariMap[hgId][roomCode][mealPlan][occCode] = [];
              }

              ariMap[hgId][roomCode][mealPlan][occCode].push({
                date: typeof day.date === 'string' ? day.date : (day.date as Date).toISOString().split('T')[0],
                price: ba.priceAfterTax || ba.price || 0,
                minLOS: daily.minLOS || 1,
                maxLOS: daily.maxLOS || 14,
                release: daily.release || 0,
                lastMinute: daily.lastMinute || 0,
                stopSell: daily.isOpen === false,
                cta: daily.isOpenOnArrival === false,
                ctd: daily.isOpenOnDeparture === false,
                alloc: day.numberOfAvailableRooms || 0,
                stayDuration: 1
              });
              totalRows++;
            });
          });
        });
      });
    });
  });

  return { ariMap, totalRows, uniqueRoomsCount: uniqueRooms.size };
};

const result = parseARISource();
export const PRELOADED_ARI = result.ariMap;

console.log("--- DETERMINISTIC ARI SOURCE LOADED ---");
console.log("SOURCE:", ARI_SOURCE.sourceType);
console.log("ARI ROWS:", result.totalRows);
console.log("UNIQUE HOTELS:", Object.keys(PRELOADED_ARI).length);
console.log("UNIQUE ROOMS:", result.uniqueRoomsCount);
console.log("---------------------------------------");

