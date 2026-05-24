/**
 * Глобальный поиск (ТЗ §7.4): параллельные запросы к 6 ресурсам с take=5.
 * Учитывает разные формы ответа (лиды — items, остальные — data).
 */
import type { Company, Contact, Deal, Lead, Product, Task } from '@/types';

import { companiesApi } from './companies';
import { contactsApi } from './contacts';
import { dealsApi } from './deals';
import { leadsApi } from './leads';
import { productsApi } from './products';
import { tasksApi } from './tasks';

export interface SearchResults {
  contacts: Contact[];
  companies: Company[];
  deals: Deal[];
  leads: Lead[];
  tasks: Task[];
  products: Product[];
}

const LIMIT = 5;

/** Возвращает группы результатов; пустые группы — пустые массивы. */
export async function globalSearch(query: string): Promise<SearchResults> {
  const q = query.trim();
  if (!q) {
    return { contacts: [], companies: [], deals: [], leads: [], tasks: [], products: [] };
  }

  const [contacts, companies, deals, leads, tasks, products] =
    await Promise.allSettled([
      contactsApi.list({ search: q, take: LIMIT }),
      companiesApi.list({ search: q, take: LIMIT }),
      dealsApi.list({ search: q, take: LIMIT }),
      leadsApi.list({ search: q, take: LIMIT }),
      tasksApi.list({ search: q, take: LIMIT }),
      productsApi.list({ search: q, take: LIMIT }),
    ]);

  return {
    contacts: contacts.status === 'fulfilled' ? contacts.value.data : [],
    companies: companies.status === 'fulfilled' ? companies.value.data : [],
    deals: deals.status === 'fulfilled' ? deals.value.data : [],
    leads: leads.status === 'fulfilled' ? leads.value.items : [],
    tasks: tasks.status === 'fulfilled' ? tasks.value.data : [],
    products: products.status === 'fulfilled' ? products.value.data : [],
  };
}
