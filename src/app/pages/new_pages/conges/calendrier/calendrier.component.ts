import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceSirhService } from '../../../../services/service-sirh.service';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
}

interface Conge {
  id: string;
  employeNom: string;
  typeConge: string;
  dateDebut: Date;
  dateFin: Date;
  statut: string;
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

  loadConges() {
    // TODO: Replace with actual API call
    // this.sirhService.getAllConges().subscribe(data => this.conges = data);
    // Mock data
    this.conges = [
      {
        id: '1',
        employeNom: 'Jean Dupont',
        typeConge: 'Congé Annuel',
        dateDebut: new Date('2024-05-01'),
        dateFin: new Date('2024-05-05'),
        statut: 'approuve'
      },
      {
        id: '2',
        employeNom: 'Marie Martin',
        typeConge: 'Congé Maladie',
        dateDebut: new Date('2024-04-15'),
        dateFin: new Date('2024-04-16'),
        statut: 'en_attente'
      }
    ];
  }

  getCongesForDay(date: Date): Conge[] {
    return this.conges.filter(conge =>
      date >= conge.dateDebut && date <= conge.dateFin
    );
  }

  selectDay(day: CalendarDay) {
    this.selectedDay = day.date;
    this.selectedDayConges = this.getCongesForDay(day.date);
  }
}
