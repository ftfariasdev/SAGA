// Script para adicionar campo id_prof ao modelo Materia
// Para executar: node fixMateria.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Verificando se o modelo Materia contém o campo id_prof...');
    
    // Verificar se podemos criar uma matéria com id_prof
    const testMateria = await prisma.materia.create({
      data: {
        nome: "TEST_MATERIA",
        descricao: "Matéria de teste",
        ch_total: "60",
        freq_min: "75",
        id_curso: "74c82f56-4a79-45f1-8a03-0438e15960ad", // Substitua pelo ID de um curso válido
        id_prof: null // Testando com valor nulo para ver se o campo existe
      }
    });
    
    console.log('Matéria criada com sucesso, o campo id_prof está disponível.');
    
    // Limpar o teste
    await prisma.materia.delete({
      where: { id_materia: testMateria.id_materia }
    });
    
    console.log('Teste concluído e limpo com sucesso.');
  } catch (error) {
    if (error.message.includes('Unknown argument `id_prof`')) {
      console.error('O campo id_prof não existe no modelo Materia. É necessário atualizar o schema e aplicar migrações.');
      console.log('\nSugestão: Execute os seguintes comandos:');
      console.log('1. npx prisma migrate dev --name add_id_prof_to_materia');
      console.log('2. npx prisma generate');
    } else {
      console.error('Erro durante o teste:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
