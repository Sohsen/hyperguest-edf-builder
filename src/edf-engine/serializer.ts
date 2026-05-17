import {
  HotelEdfModel,
  HotelEdfRoom,
  HotelEdfSeason,
  HotelEdfChargeblock,
} from './types';

/**
 * Escapes special characters in a string for use in XML content.
 * @param str The input string.
 * @returns The escaped string.
 */
function xmlEscape(str: string): string {
  return str.replace(/[<>&"']/g, (char) => {
    switch (char) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return char;
    }
  });
}

function renderAttributes(attributes: Record<string, string | number | undefined>): string {
    return Object.entries(attributes)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${key}="${xmlEscape(String(value))}"`)
        .join(' ');
}

function renderNode(name: string, attributes: Record<string, string | number | undefined>, content?: string): string {
    const attrs = renderAttributes(attributes);
    const tag = `${name}${attrs ? ' ' + attrs : ''}`;

    if (content === undefined || content === null || content === '') {
        return `<${tag}/>`;
    }

    return `<${tag}>\n${content}\n</${name}>`;
}

function serializeChargeBlocks(chargeblocks: HotelEdfChargeblock[]): string {
    if (chargeblocks.length === 0) return '';
    const content = chargeblocks.map(cb => {
        const baseCharge = renderNode('BaseCharge', {
            Amount: cb.amount,
            Board: cb.mealPlan
        });
        const baseCharges = renderNode('BaseCharges', {}, baseCharge);
        return renderNode('ChargeBlock', {}, baseCharges);
    }).join('\n');
    return renderNode('ChargeBlocks', {}, content);
}

function serializeSeasons(seasons: HotelEdfSeason[]): string {
    if (seasons.length === 0) return '';
    const content = seasons.map(s => {
        const dateBand = renderNode('DateBand', { Start: s.dateFrom, End: s.dateTo });
        const dateBands = renderNode('DateBands', {}, dateBand);
        const chargeBlocks = serializeChargeBlocks(s.chargeblocks);
        const seasonContent = [dateBands, chargeBlocks].filter(Boolean).join('\n');
        return renderNode('Season', { Label: s.seasonId }, seasonContent);
    }).join('\n');
    return renderNode('Seasons', {}, content);
}

function serializeRooms(rooms: HotelEdfRoom[]): string {
    if (rooms.length === 0) return '';
    const content = rooms.map(r => {
        const seasons = serializeSeasons(r.seasons);
        return renderNode('Room', { Code: r.roomCode }, seasons);
    }).join('\n');
    return renderNode('Rooms', {}, content);
}


/**
 * Serializes a HotelEdfModel object into a Peakwork Hotel EDF XML string.
 *
 * This function produces a deterministic XML output with stable node ordering,
 * omitting any optional nodes that are undefined or empty. It implements the
 * minimum valid root structure for a hotel as identified in the schema analysis.
 *
 * @param model - The HotelEdfModel to serialize.
 * @returns A string containing the Hotel EDF XML.
 */
export function serializeHotelEdf(model: HotelEdfModel): string {
    const basicDataAttrs = {
        Code: model.hotelId,
        TourOperatorCode: model.metadata.tourOperatorCode || 'PEAKWORK',
        Usage: model.metadata.usage || 'HotelOnly',
    };
    const basicDataNode = renderNode('BasicData', basicDataAttrs);

    const currency = model.rooms[0]?.seasons[0]?.chargeblocks[0]?.currency || 'EUR';
    const roomsNode = serializeRooms(model.rooms);
    const sellingDataNode = renderNode('SellingData', { Currency: currency }, roomsNode);

    const hotelRootContent = [basicDataNode, sellingDataNode].join('\n');
    const hotelRootAttrs = {
        'xmlns': "http://www.peakwork.com/edf/hotel",
        'xmlns:xsi': "http://www.w3.org/2001/XMLSchema-instance",
        'xsi:schemaLocation': "http://www.peakwork.com/edf/hotel edf_hotel_globalextra_pxb_merge-5.3.1.xsd",
        'SchemaVersion': "5.2.0"
    };

    return renderNode('HotelGlobalExtraRoot', hotelRootAttrs, hotelRootContent);
}
