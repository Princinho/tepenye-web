export type TypeBien = "Villa" | "Maison" | "Appartement" | "Studio" | "Bureau" | "Terrain";
export type TypeOffre = "Location" | "Vente";
export type StatutAnnonce = "Active" | "Expiree" | "Brouillon" | "EnCoursValidation";
export type TypeUtilisateur = "Client" | "Agent" | "Agence";
export type TypeMedia = "image" | "video";

export interface GeoCoordonnees {
  lat: number;
  lng: number;
}

export interface MediaAnnonce {
  id: string;
  url: string;
  typeMedia: TypeMedia;
  ordreAffichage: number;
}

export interface StatistiqueAnnonce {
  nombreVues: number;
  nombreFavoris: number;
  nombreClicsContact: number;
}

export interface Annonce {
  id: string;
  titre: string;
  description: string;
  prix: number;
  periodePaiementJours: number;
  prixMensuelNormalise: number;
  montantAvance: number;
  montantCaution: number;
  typeBien: TypeBien;
  typeOffre: TypeOffre;
  statutAnnonce: StatutAnnonce;
  adresse: string;
  quartier: string;
  localisation: GeoCoordonnees;
  nombrePieces: number;
  nombreSanitaires: number;
  estMeuble: boolean;
  aClimatisation: boolean;
  aGarage: boolean;
  etage: number | null;
  masquerTelephone: boolean;
  datePublication: string;
  dateExpiration: string;
  auteurId: string;
  medias: MediaAnnonce[];
  statistiques: StatistiqueAnnonce;
}

export interface Utilisateur {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  typeUtilisateur: TypeUtilisateur;
  estVerifie: boolean;
  soldeCredits: number;
  abonne: boolean;
  dateInscription: string;
}

export interface AnnonceFavori {
  id: string;
  utilisateurId: string;
  annonceId: string;
  dateAjout: string;
}

export interface FiltresAnnonce {
  typeOffre?: TypeOffre;
  typeBien?: TypeBien;
  prixMin?: number;
  prixMax?: number;
  nombrePiecesMin?: number;
  estMeuble?: boolean;
  aClimatisation?: boolean;
  aGarage?: boolean;
  quartier?: string;
}

export interface PagedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}