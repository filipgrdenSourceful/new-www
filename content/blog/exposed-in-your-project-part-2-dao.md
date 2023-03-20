---
author: patryk sz
tags:
  - Exposed
  - kotlin
  - ORM
  - DBAL
  - database
  - framework
  - dao
  - querydsl
date: 2023-03-20T11:03:14.093Z
meaningfullyUpdatedAt: 2023-03-20T11:03:14.104Z
title: Exposed in Your Project - Part 2 - DAO
layout: post
image: /images/exposed_blog.png
hidden: false
comments: true
published: true
---
## Overview

In this tutorial, we are going to learn how to modify our [previous code](https://brightinventions.pl/blog/exposed-in-your-project-part-1) and use JetBrains/Exposed in DAO manner.

[In the previous post](https://brightinventions.pl/blog/exposed-in-your-project-part-1) we created a simple ktor's app, added Exposed dependencies, and started with simple Person&Address relation CRUD. Now, based on the created implementation, we are going to refactor the code in order to fit DAO approach.

## Setting up a test application

***NOTE*: Because we did all the preparation in the previous blog post, we will skip this part - if you need to set up the environment, please, go to Step 1**

## Persistence layer refactoring

First, a summary, then the details. We did:
- group `PersonTable`&`AddressTable`, since `AddressTable` shouldn't be used without Person context
- added `Entity` for both,
- refactored the relations,
- removed `PersonRepository` interface and renamed `PersonRepositoryImpl` to `PersonRepository` in order to simplify the example,
- refactored `PersonRepository` in order to use Entities instead of Tables.

### tables

`PersonTable.kt`
```kotlin
import org.jetbrains.exposed.dao.id.IntIdTable

object PersonTable : IntIdTable("person") {
    val name = text("name")
    val surname = text("surname")
    val age = integer("age")
}

object AddressTable : IntIdTable("address") {
    val personId = reference("person_id", PersonTable.id)
    val street = text("street")
    val house = text("house")
    val apartment = text("apartment")
    val city = text("city")
    val postalCode = text("postal_code")
}
```

There is nothing much - we just moved `AddressTable` from a separate file to the one, common, with `PersonTable`.

### Entities

`PersonEntity.kt`
```kotlin
import org.jetbrains.exposed.dao.IntEntity
import org.jetbrains.exposed.dao.IntEntityClass
import org.jetbrains.exposed.dao.id.EntityID

class PersonEntity(id: EntityID<Int>): IntEntity(id) {
    companion object : IntEntityClass<PersonEntity>(PersonTable)

    var name by PersonTable.name
    var surname by PersonTable.surname
    var age by PersonTable.age
    val addresses by AddressEntity referrersOn AddressTable.personId
}

class AddressEntity(id: EntityID<Int>): IntEntity(id) {
    companion object : IntEntityClass<AddressEntity>(AddressTable)

    var street by AddressTable.street
    var house by AddressTable.house
    var apartment by AddressTable.apartment
    var city by AddressTable.city
    var postalCode by AddressTable.postalCode
    var personId by AddressTable.personId
}
```

`Entity` is a new term since we want to follow the Exposed DAO approach. It states for a representation of a row in the table.\
additionally, as you can see, we added `PersonEntity.addresses` relation.

`val addresses by AddressEntity referrersOn AddressTable.personId`

..which is defined by "old" `person_id` column in `address` table.

### PersonRepository refactoring

PersonRepository.kt
```kotlin
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.with
import org.jetbrains.exposed.sql.SizedCollection
import org.jetbrains.exposed.sql.transactions.transaction
import pl.brightinventions.dto.*

class PersonRepository {
    [...]
}
```

#### findAll
```kotlin
fun findAll(): List<FoundPersonWithAddressDto> = transaction {
        PersonEntity
            .all()
            .with(PersonEntity::addresses)
            .map {
                FoundPersonWithAddressDto(
                    it.id.value,
                    it.name,
                    it.surname,
                    it.age,
                    it.addresses.map {
                        FoundPersonAddressDto(
                            it.street, it.house, it.apartment, it.city, it.postalCode
                        )
                    }
                )
            }
    }
```

Based on `PersonEntity`, we have access to `find`, `all`, `findById` methods, and more. In this case, we are going to get `all()` of the records and map it, BUT!\

Since `0.13.1` version (so for a quite long time), we can define eager loading in order to prevent **n+1** problem. By adding `with(PersonEntity::addresses)`, our query execution scenario looks like:
```sql
10:51:51.958 [eventLoopGroupProxy-4-1] DEBUG Exposed - SELECT PERSON.ID, PERSON."NAME", PERSON.SURNAME, PERSON.AGE FROM PERSON
10:51:52.247 [eventLoopGroupProxy-4-1] DEBUG Exposed - SELECT ADDRESS.ID, ADDRESS.PERSON_ID, ADDRESS.STREET, ADDRESS.HOUSE, ADDRESS.APARTMENT, ADDRESS.CITY, ADDRESS.POSTAL_CODE FROM ADDRESS WHERE ADDRESS.PERSON_ID IN (1, 2, 3)
```

#### find
Because I wanted to show eager loading for `findAll()`, `find` method looks similar to the previous one:

```kotlin
fun find(id: PersonId): FoundPersonWithAddressDto? = transaction {
        PersonEntity
            .findById(id)
            ?.load(PersonEntity::addresses)
            ?.let {
                FoundPersonWithAddressDto(
                    it.id.value,
                    it.name,
                    it.surname,
                    it.age,
                    it.addresses.map {
                        FoundPersonAddressDto(
                            it.street, it.house, it.apartment, it.city, it.postalCode
                        )
                    }
                )
            }
    }
```

The only difference is that `with` is now `load` (for a single record).

#### Create, Update, Delete

```kotlin
fun create(person: CreatePersonDto): PersonId = transaction {
    PersonEntity.new {
        name = person.name
        surname = person.surname
        age = person.age
    }.id.value
}

fun delete(id: PersonId): Unit = transaction {
    PersonEntity.findById(id)?.delete()
}

fun update(id: PersonId, person: UpdatePersonDto): Unit = transaction {
    PersonEntity.findById(id)?.let {
        it.name = person.name
        it.surname = person.surname
        it.age = person.age
    }
}
```

The thing that is worth mentioning is that update/delete needs to be done on the found entity - that's why we need to `findById` the record we want to remove/update.

#### addAddress

```kotlin
fun addAddress(personId: PersonId, address: CreateAddressDto) {
        transaction {
            PersonEntity.findById(personId)?.let {
                SizedCollection(
                    it.addresses + address.let {
                        AddressEntity.new {
                            city = address.city
                            house = address.house
                            street = address.street
                            postalCode = address.postalCode
                            apartment = address.apartment
                            this.personId = EntityID(personId, PersonTable)
                        }
                    }
                )
            }
        }
    }
```

This one is a little tricky - in order to add a new address, we need to assign value to the `personId` explicitly.

## Testing

`GET http://localhost:8080/person` \
This one should respond with a list of three persons: `John`, `George`, and `Megan`. Because we want to test our query execution scenario (so we added `address` information to the list as well), it will contain full-person data.

If we want to receive data about a particular person, we need to call\
`GET http://localhost:8080/person/1`,\
which will respond with full Person DTO.

## Conclusion

In this article, we've learned how to refactor DSL to DAO approach in JetBrains/Exposed dependent project. In the next episode, I'm going to tackle some more advanced topics. Stay tuned!

** Did you like the article? Maybe you have some other way for DAO implementation? Leave a comment below and stay in touch! **

You can find the complete code [over GitHub.](https://github.com/bright/kotlin-exposed-dao-example)
