import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceSirhService } from '../../../../services/service-sirh.service';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
}

type Periode = 'MATIN' | 'APRES_MIDI' | 'JOURNEE_COMPLETE';

interface Conge {
  id: string;
  employeNom: string;
  typeConge: string;
  dateDebut: Date;
  dateFin: Date;
  statut: string;
  raw: any; // donnée brute de l'API, conservée pour pouvoir affiner la détection facilement
}

@Component({
  selector: 'app-calendrier',
  imports: [CommonModule],
  templateUrl: './calendrier.component.html',
  styleUrl: './calendrier.component.css',
})
export class CalendrierComponent implements OnInit {
  currentMonth: Date = new Date();
  calendarDays: CalendarDay[] = [];
  weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  conges: Conge[] = [];
  selectedDay: Date | null = null;
  selectedDayConges: Conge[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  constructor(private sirhService: ServiceSirhService) {}

  ngOnInit() {
    this.generateCalendar();
    this.loadConges();
  }

  generateCalendar() {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    this.calendarDays = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      this.calendarDays.push({
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === month
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  previousMonth() {
    this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
    this.currentMonth = new Date(this.currentMonth);
    this.generateCalendar();
    this.selectedDay = null;
    this.selectedDayConges = [];
  }

  nextMonth() {
    this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
    this.currentMonth = new Date(this.currentMonth);
    this.generateCalendar();
    this.selectedDay = null;
    this.selectedDayConges = [];
  }

  async loadConges() {
    this.isLoading = true;
    this.errorMessage = null;

    try {
      const rawConges = await this.sirhService.getAllConges_liste_complet();

      // Utile pour vérifier en une seconde le vrai nom des champs "demi-journée" de votre API :
      if (rawConges && rawConges.length > 0) {
        console.log('[Calendrier] Exemple de congé brut reçu de l\'API :', rawConges[0]);
      }

      this.conges = (rawConges || [])
        // Exclut les régularisations de solde ("AJUSTEMENTS"), qui ne sont pas de vraies absences
        .filter((c: any) => !this.isAjustement(c))
        .map((c: any) => ({
          id: c.id,
          employeNom: this.formatNomEmploye(c),
          typeConge: c.type_conge || c.libelle || 'Congé',
          dateDebut: new Date(c.date_debut),
          dateFin: new Date(c.date_fin),
          statut: c.statut === 'approuve' || c.statut === 'refuse' ? c.statut : 'en_attente',
          raw: c
        }));

      if (this.selectedDay) {
        this.selectedDayConges = this.getCongesForDay(this.selectedDay);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des congés', error);
      this.errorMessage = 'Impossible de charger les congés.';
      this.conges = [];
    } finally {
      this.isLoading = false;
    }
  }

  private isAjustement(c: any): boolean {
    const champsAVerifier = [c.type_conge, c.libelle, c.motif, c.code_type];
    return champsAVerifier.some(champ =>
      typeof champ === 'string' && champ.toUpperCase().includes('AJUSTEMENT')
    );
  }

  private formatNomEmploye(c: any): string {
    if (c.prenom || c.nom) {
      return `${c.prenom || ''} ${c.nom || ''}`.trim();
    }
    return c.employeNom || c.employe_nom || 'Employé';
  }

  getCongesForDay(date: Date): Conge[] {
    const target = this.stripTime(date);
    return this.conges.filter(conge => {
      const start = this.stripTime(conge.dateDebut);
      const end = this.stripTime(conge.dateFin);
      return target >= start && target <= end;
    });
  }

  // Évite les bugs de comparaison de dates liés aux heures/minutes/secondes
  private stripTime(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  selectDay(day: CalendarDay) {
    this.selectedDay = day.date;
    this.selectedDayConges = this.getCongesForDay(day.date);
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  }

  goToToday() {
    this.currentMonth = new Date();
    this.generateCalendar();
    this.selectedDay = null;
    this.selectedDayConges = [];
  }

  get monthStats() {
    const stats = { approuve: 0, en_attente: 0, refuse: 0 };
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    this.conges.forEach(c => {
      if (c.dateDebut <= monthEnd && c.dateFin >= monthStart) {
        stats[c.statut as keyof typeof stats]++;
      }
    });
    return stats;
  }

  avatarColor(nom: string): string {
    const colors = [
      'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
      'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400',
      'bg-pink-100 text-pink-600 dark:bg-pink-900/50 dark:text-pink-400',
      'bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-400',
      'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400',
      'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400',
    ];
    let hash = 0;
    for (let i = 0; i < nom.length; i++) {
      hash = nom.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  // ---- Détection demi-journée : calculée JOUR PAR JOUR, pas pour le congé entier ----
  //
  // Règle : dans un congé de plusieurs jours, seuls le premier jour (départ l'après-midi)
  // et le dernier jour (retour le matin) peuvent être des demi-journées. Les jours au
  // milieu sont toujours complets.
  //
  // ⚠️ Cette fonction regarde d'abord des champs explicites que l'API pourrait envoyer
  // (periode_debut/periode_fin, demi_journee_debut/fin...), puis se rabat sur l'heure
  // contenue dans date_debut/date_fin. Si vos dates n'ont pas d'heure (toujours 00:00:00),
  // aucune des deux méthodes ne peut fonctionner : il faut alors le vrai nom du champ API
  // (regardez le `console.log` ajouté dans loadConges(), visible dans la console du navigateur).
  getPeriodePourJour(conge: Conge, date: Date): Periode {
    const jour = this.stripTime(date);
    const debut = this.stripTime(conge.dateDebut);
    const fin = this.stripTime(conge.dateFin);
    const uneSeuleJournee = debut.getTime() === fin.getTime();
    const estPremierJour = jour.getTime() === debut.getTime();
    const estDernierJour = jour.getTime() === fin.getTime();

    if (!uneSeuleJournee && !estPremierJour && !estDernierJour) {
      return 'JOURNEE_COMPLETE'; // jour au milieu d'un congé multi-jours
    }

    // 1) Champs explicites éventuels sur l'objet brut (à adapter selon votre API)
    const c = conge.raw || {};
    const champPourCeJour = uneSeuleJournee
      ? (c.periode ?? c.type_periode ?? c.moment ?? c.session)
      : estPremierJour
        ? (c.periode_debut ?? c.demi_journee_debut ?? c.moment_debut)
        : (c.periode_fin ?? c.demi_journee_fin ?? c.moment_fin);

    if (typeof champPourCeJour === 'string') {
      const val = champPourCeJour.toUpperCase();
      if (val.includes('MATIN') || val === 'AM' || val === 'MORNING') return 'MATIN';
      if (val.includes('APRES') || val.includes('MIDI') || val === 'PM' || val === 'AFTERNOON') return 'APRES_MIDI';
    }

    // 2) Repli sur l'heure de la date de début/fin
    const heureDebut = conge.dateDebut.getHours();
    const heureFin = conge.dateFin.getHours();

    if (uneSeuleJournee) {
      if (heureDebut >= 12) return 'APRES_MIDI';
      if (heureFin > 0 && heureFin <= 13) return 'MATIN';
      return 'JOURNEE_COMPLETE';
    }
    if (estPremierJour && heureDebut >= 12) return 'APRES_MIDI';
    if (estDernierJour && heureFin > 0 && heureFin <= 13) return 'MATIN';

    return 'JOURNEE_COMPLETE';
  }

  isHalfDay(conge: Conge, date: Date): boolean {
    return this.getPeriodePourJour(conge, date) !== 'JOURNEE_COMPLETE';
  }

  periodeLabelPourJour(conge: Conge, date: Date): string {
    switch (this.getPeriodePourJour(conge, date)) {
      case 'MATIN': return 'Demi-journée (matin)';
      case 'APRES_MIDI': return 'Demi-journée (après-midi)';
      default: return 'Journée complète';
    }
  }

  periodeAbrege(conge: Conge, date: Date): string {
    switch (this.getPeriodePourJour(conge, date)) {
      case 'MATIN': return 'MATIN';
      case 'APRES_MIDI': return 'APRES-MIDI';
      default: return '';
    }
  }
}