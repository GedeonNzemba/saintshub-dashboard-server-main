// DASHBOARD
export interface Principal {
    pastor: string
    wife: string
    image: string
    description: string
  }
  
  export interface Deacon {
    names: string
    descriptions: string
    image: string
  }
  
  export interface Trustee {
    names: string
    descriptions: string
    image: string
  }
  
  export interface Securities {
    deacons: Deacon[]
    trustees: Trustee[]
  }
  
  export interface Security {
    names: string
    descriptions: string
    image: string
  }
  
  export interface LiveService {
    title: string
    preacher: string
    sermon: string
  }
  
  interface Songs {
    title: string
    songUrl: string
  }
  
  export interface ChurchDoc {
    logo: string
    name: string
    principal: Principal
    location: string
    image: string
    banner: string[]
    securities: Securities
    oldServices: LiveService[]
    gallery: string[]
    songs: Songs[]
  }
  