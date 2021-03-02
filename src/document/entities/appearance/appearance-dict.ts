import { valueTypes } from "../../const";
import { CryptInfo } from "../../common-interfaces";
import { ParseInfo, ParseResult } from "../../data-parser";
import { ObjectId } from "../core/object-id";
import { PdfDict } from "../core/pdf-dict";
import { ObjectMapDict } from "../misc/object-map-dict";
import { XFormStream } from "../streams/x-form-stream";

export class AppearanceDict extends PdfDict {
  /**
   * (Required) The annotation’s normal appearance 
   */
  N: ObjectMapDict | ObjectId;
  /**
   * (Optional) The annotation’s rollover appearance
   */
  R: ObjectMapDict | ObjectId; 
  /**
   * (Optional) The annotation’s down appearance
   */
  D: ObjectMapDict | ObjectId; 

  protected _streamsMap = new Map<string, XFormStream>();
  
  constructor() {
    super(null);
  } 
  
  static parse(parseInfo: ParseInfo): ParseResult<AppearanceDict> {    
    const appearance = new AppearanceDict();
    const parseResult = appearance.tryParseProps(parseInfo);

    return parseResult
      ? {value: appearance, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
      : null;
  }
  
  getStream(key: string): XFormStream {
    return this._streamsMap.get(key);
  }

  *getStreams(): Iterable<XFormStream> {
    for (const pair of this._streamsMap) {
      yield pair[1];
    }
    return;
  }
  
  setStream(key: string, stream: XFormStream) {
    return this._streamsMap.set(key, stream);
  }
  
  clearStreams() {
    this._streamsMap.clear();
  }

  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.N) {
      bytes.push(...encoder.encode("/N "));
      if (this.N instanceof ObjectMapDict) {        
        bytes.push(...this.N.toArray(cryptInfo));
      } else {               
        bytes.push(...this.N.toArray(cryptInfo));
      }
    }
    if (this.R) {
      bytes.push(...encoder.encode("/R "));
      if (this.R instanceof ObjectMapDict) {        
        bytes.push(...this.R.toArray(cryptInfo));
      } else {               
        bytes.push(...this.R.toArray(cryptInfo));
      }
    }
    if (this.D) {
      bytes.push(...encoder.encode("/D "));
      if (this.D instanceof ObjectMapDict) {        
        bytes.push(...this.D.toArray(cryptInfo));
      } else {               
        bytes.push(...this.D.toArray(cryptInfo));
      }
    }

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }

  protected fillStreamsMap(parseInfoGetter: (id: number) => ParseInfo) {
    this._streamsMap.clear();

    for (const prop of ["N", "R", "D"]) {
      if (this[prop]) {
        if (this[prop] instanceof ObjectId) {
          const streamParseInfo = parseInfoGetter(this[prop].id);
          if (!streamParseInfo) {
            continue;
          }
          const stream = XFormStream.parse(streamParseInfo);
          if (!stream) {
            continue;
          }
          if (stream) {
            this._streamsMap.set(`/${prop}`, stream.value);
          }
        } else {
          for (const [name, objectId] of this[prop].getProps()) {
            const streamParseInfo = parseInfoGetter(objectId.id);
            if (!streamParseInfo) {
              continue;
            }
            const stream = XFormStream.parse(streamParseInfo);
            if (stream) {
              this._streamsMap.set(`/${prop}${name}`, stream.value);
            }
          }
        }
      }
    }
  }
  
  /**
   * fill public properties from data using info/parser if available
   */
  protected tryParseProps(parseInfo: ParseInfo): boolean {
    const superIsParsed = super.tryParseProps(parseInfo);
    if (!superIsParsed) {
      return false;
    }

    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const end = bounds.contentEnd || bounds.end; 
    
    let i = parser.skipToNextName(start, end - 1);
    if (i === -1) {
      // no required props found
      return false;
    }
    let name: string;
    let parseResult: ParseResult<string>;
    while (true) {
      parseResult = parser.parseNameAt(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        switch (name) {
          case "/N":
            const nEntryType = parser.getValueTypeAt(i);
            if (nEntryType === valueTypes.REF) {              
              const nRefId = ObjectId.parseRef(parser, i);
              if (nRefId) {
                this.N = nRefId.value;
                i = nRefId.end + 1;
                break;
              }
            } else if (nEntryType === valueTypes.DICTIONARY) {     
              const nDictBounds = parser.getDictBoundsAt(i);
              if (nDictBounds) {
                const nSubDict = ObjectMapDict.parse({parser, bounds: nDictBounds});
                if (nSubDict) {
                  this.N = nSubDict.value;
                  i = nSubDict.end + 1;
                  break;
                }
              }
            } else {
              throw new Error(`Unsupported /N property value type: ${nEntryType}`);
            }
            throw new Error("Can't parse /N property value");
            
          case "/R":
            const rEntryType = parser.getValueTypeAt(i);
            if (rEntryType === valueTypes.REF) {              
              const rRefId = ObjectId.parseRef(parser, i);
              if (rRefId) {
                this.R = rRefId.value;
                i = rRefId.end + 1;
                break;
              }
            } else if (rEntryType === valueTypes.DICTIONARY) {     
              const rDictBounds = parser.getDictBoundsAt(i);
              if (rDictBounds) {
                const rSubDict = ObjectMapDict.parse({parser, bounds: rDictBounds});
                if (rSubDict) {
                  this.R = rSubDict.value;
                  i = rSubDict.end + 1;
                  break;
                }
              }
            } else {
              throw new Error(`Unsupported /R property value type: ${rEntryType}`);
            }
            throw new Error("Can't parse /R property value");

          case "/D":
            const dEntryType = parser.getValueTypeAt(i);
            if (dEntryType === valueTypes.REF) {              
              const dRefId = ObjectId.parseRef(parser, i);
              if (dRefId) {
                this.D = dRefId.value;
                i = dRefId.end + 1;
                break;
              }
            } else if (dEntryType === valueTypes.DICTIONARY) {     
              const dDictBounds = parser.getDictBoundsAt(i);
              if (dDictBounds) {
                const dSubDict = ObjectMapDict.parse({parser, bounds: dDictBounds});
                if (dSubDict) {
                  this.D = dSubDict.value;
                  i = dSubDict.end + 1;
                  break;
                }
              }
            } else {
              throw new Error(`Unsupported /D property value type: ${dEntryType}`);
            }
            throw new Error("Can't parse /D property value");
          default:
            // skip to next name
            i = parser.skipToNextName(i, end - 1);
            break;
        }
      } else {
        break;
      }
    };
    
    if (!this.N) {
      // not all required properties parsed
      return false;
    }

    if (parseInfo.parseInfoGetter) {
      this.fillStreamsMap(parseInfo.parseInfoGetter);
    }

    return true;
  }
}
