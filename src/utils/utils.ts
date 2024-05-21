import { EventDto } from "../modules/event/Dto/event.dto";
import { Double } from 'typeorm';
import {locationDto} from '../modules/htmr/Dto/locationsDto';

export function IsPointInPolygon( point: Array<number>, polygon: Array<locationDto> )
{
    const x = 0;
    const y = 1;
    let minX = polygon[0].latitude;
    let maxX = polygon[0].latitude;
    let minY = polygon[0].longtitude;
    let maxY = polygon[0].longtitude;
    for ( let index = 1 ; index < polygon.length ; index++ )
    {
        let q = polygon[ index ];
        minX = Math.min( Number(q.latitude), Number(minX) );
        maxX = Math.max( Number(q.latitude), Number(maxX) );
        minY = Math.min( Number(q.longtitude), Number(minY) );
        maxY = Math.max( Number(q.longtitude), Number(minY) );
    }

    if ( point[x] < minX || point[x] > maxX || point[y] < minY || point[y] > maxY )
    {
        return false;
    }

    let isInside = false;
    for ( let index = 0, j = polygon.length - 1 ; index < polygon.length ; j = index++ )
    {
        if ( ( polygon[index].longtitude > point[y] ) != ( polygon[ j ].longtitude > point[y] ) &&
             point[x] < ( Number(polygon[j].latitude) - Number(polygon[index].latitude) ) * 
             ( point[y] - Number(polygon[index].longtitude) ) / 
             ( Number(polygon[ j ].longtitude) - Number(polygon[ index ].longtitude)) + Number(polygon[ index ].latitude) )
        { 
            isInside = !isInside;
        }
    }

    return isInside;
}

export const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1); 
    var dLon = deg2rad(lon2-lon1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    return d;
  }
  
  function deg2rad(deg) {
    return deg * (Math.PI/180)
}

export function isPointInArea(point: Array<number>, polygon: Array<locationDto>) {
    let x = point[0], y = point[1];
    
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        let xi = Number(polygon[i].latitude), yi = Number(polygon[i].longtitude);
        let xj = Number(polygon[j].latitude), yj = Number(polygon[j].longtitude);
        
        let intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    
    return inside;
};

