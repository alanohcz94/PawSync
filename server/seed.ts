import { db } from "./db";
import { users, pets, homeworkTasks, homeworkSubmissions, trainerComments } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  try {
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      console.log("Database already has data, skipping seed");
      return;
    }

    console.log("Seeding database with sample data...");

    const [trainer1] = await db.insert(users).values({
      email: "sarah.trainer@pawsync.demo",
      firstName: "Sarah",
      lastName: "Johnson",
      role: "TRAINER",
      profileImageUrl: null,
    }).returning();

    const [trainer2] = await db.insert(users).values({
      email: "mike.trainer@pawsync.demo",
      firstName: "Mike",
      lastName: "Chen",
      role: "TRAINER",
      profileImageUrl: null,
    }).returning();

    const [owner1] = await db.insert(users).values({
      email: "emily.owner@pawsync.demo",
      firstName: "Emily",
      lastName: "Parker",
      role: "OWNER",
      profileImageUrl: null,
    }).returning();

    const [owner2] = await db.insert(users).values({
      email: "james.owner@pawsync.demo",
      firstName: "James",
      lastName: "Wilson",
      role: "OWNER",
      profileImageUrl: null,
    }).returning();

    const [owner3] = await db.insert(users).values({
      email: "lisa.owner@pawsync.demo",
      firstName: "Lisa",
      lastName: "Martinez",
      role: "OWNER",
      profileImageUrl: null,
    }).returning();

    const [owner4] = await db.insert(users).values({
      email: "david.owner@pawsync.demo",
      firstName: "David",
      lastName: "Thompson",
      role: "OWNER",
      profileImageUrl: null,
    }).returning();

    const [pet1] = await db.insert(pets).values({
      name: "Buddy",
      species: "Golden Retriever",
      ownerId: owner1.id,
      trainerId: trainer1.id,
      imageUrl: null,
    }).returning();

    const [pet2] = await db.insert(pets).values({
      name: "Luna",
      species: "Siamese Cat",
      ownerId: owner1.id,
      trainerId: null,
      imageUrl: null,
    }).returning();

    const [pet3] = await db.insert(pets).values({
      name: "Max",
      species: "German Shepherd",
      ownerId: owner2.id,
      trainerId: trainer2.id,
      imageUrl: null,
    }).returning();

    const [pet4] = await db.insert(pets).values({
      name: "Bella",
      species: "Labrador Retriever",
      ownerId: owner2.id,
      trainerId: trainer1.id,
      imageUrl: null,
    }).returning();

    const [pet5] = await db.insert(pets).values({
      name: "Charlie",
      species: "Beagle",
      ownerId: owner3.id,
      trainerId: trainer1.id,
      imageUrl: null,
    }).returning();

    const [pet6] = await db.insert(pets).values({
      name: "Daisy",
      species: "Poodle",
      ownerId: owner3.id,
      trainerId: trainer2.id,
      imageUrl: null,
    }).returning();

    const [pet7] = await db.insert(pets).values({
      name: "Rocky",
      species: "Boxer",
      ownerId: owner4.id,
      trainerId: trainer1.id,
      imageUrl: null,
    }).returning();

    const [pet8] = await db.insert(pets).values({
      name: "Milo",
      species: "French Bulldog",
      ownerId: owner4.id,
      trainerId: trainer2.id,
      imageUrl: null,
    }).returning();

    const [task1] = await db.insert(homeworkTasks).values({
      petId: pet1.id,
      createdByTrainerId: trainer1.id,
      title: "Practice 'Sit' Command",
      instructions: "Use treats to lure Buddy into a sitting position. Say 'sit' clearly before the action. Reward immediately when successful. Practice 10 repetitions per session.",
      frequency: "daily",
      expectedDurationMins: 10,
      isActive: true,
    }).returning();

    const [task2] = await db.insert(homeworkTasks).values({
      petId: pet1.id,
      createdByTrainerId: trainer1.id,
      title: "Leash Walking Practice",
      instructions: "Start with short 5-minute walks around the block. Keep the leash loose but maintain control. Reward calm walking behavior with treats.",
      frequency: "3x/week",
      expectedDurationMins: 15,
      isActive: true,
    }).returning();

    const [task3] = await db.insert(homeworkTasks).values({
      petId: pet1.id,
      createdByTrainerId: trainer1.id,
      title: "Recall Training",
      instructions: "Practice 'come' command in a safe, enclosed area. Start from short distances and gradually increase. Always reward with high-value treats.",
      frequency: "daily",
      expectedDurationMins: 5,
      isActive: true,
    }).returning();

    const [task4] = await db.insert(homeworkTasks).values({
      petId: pet3.id,
      createdByTrainerId: trainer2.id,
      title: "Crate Training",
      instructions: "Introduce Max to the crate gradually. Make it a positive space with treats and toys. Never use the crate as punishment.",
      frequency: "daily",
      expectedDurationMins: 20,
      isActive: true,
    }).returning();

    const [task5] = await db.insert(homeworkTasks).values({
      petId: pet3.id,
      createdByTrainerId: trainer2.id,
      title: "Stay Command",
      instructions: "Start with 'sit', then add 'stay'. Begin with 5-second holds and gradually increase. Release with 'okay' command.",
      frequency: "daily",
      expectedDurationMins: 10,
      isActive: true,
    }).returning();

    const [task6] = await db.insert(homeworkTasks).values({
      petId: pet4.id,
      createdByTrainerId: trainer1.id,
      title: "Fetch Training",
      instructions: "Use a favorite toy. Throw short distances at first. Reward when Bella brings the toy back. Use 'drop it' command to release.",
      frequency: "3x/week",
      expectedDurationMins: 15,
      isActive: true,
    }).returning();

    const [task7] = await db.insert(homeworkTasks).values({
      petId: pet5.id,
      createdByTrainerId: trainer1.id,
      title: "Nose Work Basics",
      instructions: "Hide treats in easy spots and encourage Charlie to find them. Say 'find it' as a cue. Great mental stimulation for beagles!",
      frequency: "daily",
      expectedDurationMins: 10,
      isActive: true,
    }).returning();

    const [task8] = await db.insert(homeworkTasks).values({
      petId: pet6.id,
      createdByTrainerId: trainer2.id,
      title: "Grooming Tolerance",
      instructions: "Practice handling paws, ears, and mouth daily. Reward calm behavior. Use treats to create positive associations with grooming tools.",
      frequency: "daily",
      expectedDurationMins: 10,
      isActive: true,
    }).returning();

    const [task9] = await db.insert(homeworkTasks).values({
      petId: pet7.id,
      createdByTrainerId: trainer1.id,
      title: "Down Command",
      instructions: "From a sit position, lure Rocky into a down with a treat. Say 'down' before the movement. Practice on comfortable surfaces.",
      frequency: "daily",
      expectedDurationMins: 10,
      isActive: true,
    }).returning();

    const [task10] = await db.insert(homeworkTasks).values({
      petId: pet8.id,
      createdByTrainerId: trainer2.id,
      title: "Socialization Practice",
      instructions: "Expose Milo to different sounds, people, and environments. Keep sessions short and positive. Watch for signs of stress.",
      frequency: "3x/week",
      expectedDurationMins: 20,
      isActive: true,
    }).returning();

    const [submission1] = await db.insert(homeworkSubmissions).values({
      taskId: task1.id,
      submittedByUserId: owner1.id,
      note: "Buddy did really well today! He responded to the sit command 8 out of 10 times. Very proud of his progress.",
      status: "COMPLETED",
    }).returning();

    const [submission2] = await db.insert(homeworkSubmissions).values({
      taskId: task3.id,
      submittedByUserId: owner1.id,
      note: "Worked on recall in the backyard. Buddy came running every time! He's getting much better at this.",
      status: "COMPLETED",
    }).returning();

    const [submission3] = await db.insert(homeworkSubmissions).values({
      taskId: task2.id,
      submittedByUserId: owner1.id,
      note: "Had a great walk around the neighborhood. Buddy only pulled a couple times at the beginning.",
      status: "COMPLETED",
    }).returning();

    const [submission4] = await db.insert(homeworkSubmissions).values({
      taskId: task4.id,
      submittedByUserId: owner2.id,
      note: "Max went into the crate voluntarily today for the first time! Left the door open and he chose to nap there.",
      status: "COMPLETED",
    }).returning();

    const [submission5] = await db.insert(homeworkSubmissions).values({
      taskId: task5.id,
      submittedByUserId: owner2.id,
      note: "Practiced stay for 15 seconds today. Max is getting really good at waiting patiently.",
      status: "COMPLETED",
    }).returning();

    const [submission6] = await db.insert(homeworkSubmissions).values({
      taskId: task6.id,
      submittedByUserId: owner2.id,
      note: "Bella loves fetch! She brought the ball back 10 times in a row. Working on the drop command next.",
      status: "COMPLETED",
    }).returning();

    const [submission7] = await db.insert(homeworkSubmissions).values({
      taskId: task7.id,
      submittedByUserId: owner3.id,
      note: "Charlie found all 5 hidden treats in under 2 minutes! His nose work skills are improving.",
      status: "COMPLETED",
    }).returning();

    const [submission8] = await db.insert(homeworkSubmissions).values({
      taskId: task8.id,
      submittedByUserId: owner3.id,
      note: "Daisy let me brush her for 10 minutes today without fussing. Big improvement from last week!",
      status: "COMPLETED",
    }).returning();

    const [submission9] = await db.insert(homeworkSubmissions).values({
      taskId: task9.id,
      submittedByUserId: owner4.id,
      note: "Rocky struggled a bit with down today. He kept trying to stand back up. Will keep practicing.",
      status: "COMPLETED",
    }).returning();

    const [submission10] = await db.insert(homeworkSubmissions).values({
      taskId: task10.id,
      submittedByUserId: owner4.id,
      note: "Took Milo to the pet store. He met 3 new people and 2 dogs. A bit nervous but handled it well overall.",
      status: "COMPLETED",
    }).returning();

    const [submission11] = await db.insert(homeworkSubmissions).values({
      taskId: task1.id,
      submittedByUserId: owner1.id,
      note: "Another great session! 9 out of 10 sits today. Buddy is almost perfect at this now.",
      status: "COMPLETED",
    }).returning();

    const [submission12] = await db.insert(homeworkSubmissions).values({
      taskId: task4.id,
      submittedByUserId: owner2.id,
      note: "Max slept in the crate all night with the door closed! No whining at all. So proud of him.",
      status: "COMPLETED",
    }).returning();

    await db.insert(trainerComments).values({
      submissionId: submission1.id,
      trainerId: trainer1.id,
      comment: "Great progress! 8 out of 10 is excellent for this stage. Keep up the consistent practice and try adding a hand signal next.",
    });

    await db.insert(trainerComments).values({
      submissionId: submission2.id,
      trainerId: trainer1.id,
      comment: "Wonderful! The enclosed backyard is perfect for recall practice. Try adding some distractions next week to level up the training.",
    });

    await db.insert(trainerComments).values({
      submissionId: submission3.id,
      trainerId: trainer1.id,
      comment: "Excellent work on the leash walking! The pulling at the beginning is normal. Try stopping and waiting when he pulls.",
    });

    await db.insert(trainerComments).values({
      submissionId: submission4.id,
      trainerId: trainer2.id,
      comment: "This is a huge milestone! Voluntary crate entry is exactly what we want. Keep making it a positive space.",
    });

    await db.insert(trainerComments).values({
      submissionId: submission5.id,
      trainerId: trainer2.id,
      comment: "15 seconds is great progress! Let's aim for 30 seconds next week. Remember to vary your distance too.",
    });

    await db.insert(trainerComments).values({
      submissionId: submission6.id,
      trainerId: trainer1.id,
      comment: "Bella sounds like a natural retriever! For the drop command, try trading the ball for a treat.",
    });

    await db.insert(trainerComments).values({
      submissionId: submission7.id,
      trainerId: trainer1.id,
      comment: "Charlie is doing amazing! Beagles are naturals at this. Try hiding treats in harder spots next time.",
    });

    await db.insert(trainerComments).values({
      submissionId: submission8.id,
      trainerId: trainer2.id,
      comment: "10 minutes is wonderful! Daisy is building trust with the grooming routine. Keep up the positive associations!",
    });

    await db.insert(trainerComments).values({
      submissionId: submission9.id,
      trainerId: trainer1.id,
      comment: "Down can be challenging for some dogs. Try practicing on a soft mat and using higher value treats. Be patient!",
    });

    await db.insert(trainerComments).values({
      submissionId: submission10.id,
      trainerId: trainer2.id,
      comment: "Great job with the socialization! Some nervousness is normal. You handled it well by keeping the session positive.",
    });

    await db.insert(trainerComments).values({
      submissionId: submission11.id,
      trainerId: trainer1.id,
      comment: "Almost perfect! Time to add distractions during the sit command. Try practicing during TV time or when the doorbell rings.",
    });

    await db.insert(trainerComments).values({
      submissionId: submission12.id,
      trainerId: trainer2.id,
      comment: "Sleeping through the night is a major success! Max has clearly learned that the crate is his safe space. Outstanding progress!",
    });

    console.log("Database seeded successfully with demo data!");
    console.log(`Created: 2 trainers, 4 owners, 8 pets, 10 tasks, 12 submissions, 12 comments`);
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
